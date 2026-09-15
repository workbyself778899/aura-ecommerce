"use client";

import { useCartStore } from "@/store/cartStore";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import {
  ShoppingBag,
  Loader2,
  Lock,
  QrCode,
  CreditCard,
  Building2,
  Copy,
  Check,
  UploadCloud,
  FileText,
  X,
  AlertCircle,
  Truck,
  Phone,
  User,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";
import { getPublicPaymentSettings } from "@/actions/payments";
import type { IPublicPaymentSettings } from "@/types";

export default function CheckoutPage() {
  const { items, getTotalPrice, clearCart } = useCartStore();
  const { data: session } = useSession();
  const router = useRouter();

  // Settings & methods
  const [settings, setSettings] = useState<IPublicPaymentSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<"ESEWA" | "QR_CODE" | "CASH_ON_DELIVERY">("ESEWA");
  const [qrTab, setQrTab] = useState<"bank" | "esewa">("esewa");

  // Form states
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [line1, setLine1] = useState("");
  const [city, setCity] = useState("Kathmandu");
  const [stateName, setStateName] = useState("Bagmati");
  const [postalCode, setPostalCode] = useState("44600");
  const [customerNotes, setCustomerNotes] = useState("");

  // Payment proof states
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [transactionRef, setTransactionRef] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalPrice = getTotalPrice();
  const shippingFee = totalPrice >= 100 ? 0 : 9.99;
  const finalTotal = totalPrice + shippingFee;

  useEffect(() => {
    if (items.length === 0) {
      router.push("/products");
    }
  }, [items.length, router]);

  // Autofill if logged in
  useEffect(() => {
    if (session?.user?.name && !fullName) {
      setFullName(session.user.name);
    }
  }, [session, fullName]);

  // Load public payment settings
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await getPublicPaymentSettings();
        setSettings(res);

        // Select first available payment method
        if (res.esewa?.enabled) {
          setPaymentMethod("ESEWA");
        } else if (res.qrPayment?.enabled) {
          setPaymentMethod("QR_CODE");
        } else if (res.cashOnDelivery?.enabled) {
          setPaymentMethod("CASH_ON_DELIVERY");
        }
      } catch (err) {
        console.error("Failed to load payment settings:", err);
      } finally {
        setLoadingSettings(false);
      }
    }
    loadSettings();
  }, []);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      toast.error("File size must be less than 15MB");
      return;
    }

    setProofFile(file);
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setProofPreview(url);
    } else {
      setProofPreview(null);
    }
  };

  const removeProofFile = () => {
    setProofFile(null);
    if (proofPreview) {
      URL.revokeObjectURL(proofPreview);
      setProofPreview(null);
    }
  };

  const handleCheckout = async () => {
    if (!fullName.trim()) {
      toast.error("Please enter your full name");
      return;
    }
    if (!phone.trim()) {
      toast.error("Please enter your contact phone number");
      return;
    }
    if (!line1.trim()) {
      toast.error("Please enter your delivery street address");
      return;
    }

    // QR Payment specific validation
    if (paymentMethod === "QR_CODE") {
      if (!proofFile) {
        toast.error("Please upload your screenshot or PDF receipt proof");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      let uploadedProof: {
        fileUrl: string;
        fileName: string;
        fileType: string;
        notes: string;
      } | null = null;

      // 1. If QR Code payment, upload proof first
      if (paymentMethod === "QR_CODE" && proofFile) {
        toast.loading("Uploading payment proof...", { id: "upload-toast" });
        const uploadData = new FormData();
        uploadData.append("file", proofFile);
        uploadData.append("notes", transactionRef);

        const uploadRes = await fetch("/api/payment-proof/upload", {
          method: "POST",
          body: uploadData,
        });

        toast.dismiss("upload-toast");

        if (!uploadRes.ok) {
          throw new Error("Failed to upload proof of payment. Please try again.");
        }

        const uploadJson = await uploadRes.json();
        uploadedProof = {
          fileUrl: uploadJson.fileUrl,
          fileName: uploadJson.fileName,
          fileType: uploadJson.fileType,
          notes: transactionRef,
        };
      }

      // 2. Call checkout API
      const checkoutRes = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.productId,
            title: item.title,
            price: item.price,
            quantity: item.quantity,
            imageUrl: item.imageUrl,
            variantName: item.variantName,
            sku: item.sku,
          })),
          userId: session?.user?.id || "guest",
          paymentMethod,
          shippingAddress: {
            fullName,
            phone,
            line1,
            city,
            state: stateName,
            postalCode,
            country: "NP",
          },
          paymentProof: uploadedProof,
          customerNotes,
        }),
      });

      const data = await checkoutRes.json();

      if (!checkoutRes.ok) {
        throw new Error(data.error || "Failed to process order");
      }

      // 3. Process according to payment method
      if (paymentMethod === "ESEWA") {
        // Build and submit form to eSewa
        const form = document.createElement("form");
        form.method = "POST";
        form.action = data.url;

        Object.entries(data.payload as Record<string, string>).forEach(([key, value]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = value;
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
      } else {
        // QR Code or Cash on Delivery -> Redirect to Success
        clearCart();
        toast.success("Order placed successfully!");
        router.push(
          `/checkout/success?orderNumber=${data.orderNumber}&method=${paymentMethod}`
        );
      }
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Checkout failed. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="section-title text-white">Checkout</h1>
        <p className="text-sm text-gray-400 mt-1">
          Complete your delivery details and choose your preferred payment method.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Delivery & Payment options */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Delivery Information */}
          <div className="glass rounded-2xl p-6 border border-white/5 space-y-5">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <MapPin className="w-5 h-5 text-purple-400" />
              <h2 className="text-base font-semibold text-white">1. Shipping & Contact Details</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Aarav Sharma"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  Phone Number <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9841000000"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  Street Address / Landmark <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={line1}
                  onChange={(e) => setLine1(e.target.value)}
                  placeholder="e.g. House #14, Baneshwor Height"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  City / District <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Kathmandu"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  State / Province
                </label>
                <input
                  type="text"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  placeholder="Bagmati Province"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Delivery Instructions (Optional)
              </label>
              <textarea
                rows={2}
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                placeholder="Special delivery notes or gate directions..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors resize-none"
              />
            </div>
          </div>

          {/* 2. Payment Method Selector */}
          <div className="glass rounded-2xl p-6 border border-white/5 space-y-6">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <CreditCard className="w-5 h-5 text-green-400" />
              <h2 className="text-base font-semibold text-white">2. Select Payment Method</h2>
            </div>

            {loadingSettings ? (
              <div className="flex items-center justify-center py-8 text-gray-400 gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading available payment channels...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* eSewa Option */}
                  {settings?.esewa?.enabled && (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("ESEWA")}
                      className={`flex items-center gap-3.5 p-4 rounded-xl border text-left transition-all ${
                        paymentMethod === "ESEWA"
                          ? "border-[#60bb46] bg-[#60bb46]/10 text-white shadow-lg shadow-[#60bb46]/5"
                          : "border-white/10 bg-white/2 text-gray-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-lg bg-[#60bb46] flex items-center justify-center font-black text-white text-lg flex-shrink-0">
                        e
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-sm text-white">eSewa Wallet</span>
                          {paymentMethod === "ESEWA" && (
                            <span className="w-2 h-2 rounded-full bg-[#60bb46]" />
                          )}
                        </div>
                        <p className="text-xs text-gray-400 truncate">
                          Instant online payment via eSewa
                        </p>
                      </div>
                    </button>
                  )}

                  {/* QR Code / Bank Transfer Option */}
                  {settings?.qrPayment?.enabled && (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("QR_CODE")}
                      className={`flex items-center gap-3.5 p-4 rounded-xl border text-left transition-all ${
                        paymentMethod === "QR_CODE"
                          ? "border-purple-500 bg-purple-500/10 text-white shadow-lg shadow-purple-500/5"
                          : "border-white/10 bg-white/2 text-gray-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white flex-shrink-0">
                        <QrCode className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-sm text-white">QR / Bank Transfer</span>
                          {paymentMethod === "QR_CODE" && (
                            <span className="w-2 h-2 rounded-full bg-purple-400" />
                          )}
                        </div>
                        <p className="text-xs text-gray-400 truncate">
                          Scan QR & upload proof receipt
                        </p>
                      </div>
                    </button>
                  )}

                  {/* Cash On Delivery Option (if enabled) */}
                  {settings?.cashOnDelivery?.enabled && (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("CASH_ON_DELIVERY")}
                      className={`flex items-center gap-3.5 p-4 rounded-xl border text-left transition-all ${
                        paymentMethod === "CASH_ON_DELIVERY"
                          ? "border-amber-500 bg-amber-500/10 text-white shadow-lg shadow-amber-500/5"
                          : "border-white/10 bg-white/2 text-gray-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center text-black flex-shrink-0">
                        <Truck className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-sm text-white">Cash on Delivery</span>
                          {paymentMethod === "CASH_ON_DELIVERY" && (
                            <span className="w-2 h-2 rounded-full bg-amber-400" />
                          )}
                        </div>
                        <p className="text-xs text-gray-400 truncate">
                          Pay upon delivery
                        </p>
                      </div>
                    </button>
                  )}
                </div>

                {/* If both eSewa and QR are disabled */}
                {!settings?.esewa?.enabled &&
                  !settings?.qrPayment?.enabled &&
                  !settings?.cashOnDelivery?.enabled && (
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <span>
                        Payment channels are temporarily paused by administrator. Please check back shortly.
                      </span>
                    </div>
                  )}

                {/* ========================================================= */}
                {/* QR Code / Bank Transfer Section Details                    */}
                {/* ========================================================= */}
                {paymentMethod === "QR_CODE" && settings?.qrPayment?.enabled && (
                  <div className="p-5 rounded-2xl bg-purple-950/20 border border-purple-500/20 space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-500/10 pb-3">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-purple-400" />
                        <span className="text-sm font-semibold text-white">
                          Transfer Amount: {formatPrice(finalTotal)}
                        </span>
                      </div>

                      {/* Tab between eSewa QR and Bank QR */}
                      <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 text-xs">
                        <button
                          type="button"
                          onClick={() => setQrTab("esewa")}
                          className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                            qrTab === "esewa"
                              ? "bg-[#60bb46] text-white"
                              : "text-gray-400 hover:text-white"
                          }`}
                        >
                          eSewa QR
                        </button>
                        <button
                          type="button"
                          onClick={() => setQrTab("bank")}
                          className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                            qrTab === "bank"
                              ? "bg-purple-600 text-white"
                              : "text-gray-400 hover:text-white"
                          }`}
                        >
                          Bank Transfer
                        </button>
                      </div>
                    </div>

                    {/* QR Code View */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                      {/* Left: QR Display */}
                      <div className="flex flex-col items-center justify-center p-4 bg-black/40 rounded-2xl border border-white/5 text-center">
                        {qrTab === "esewa" ? (
                          settings.qrPayment.esewaQrImageUrl ? (
                            <div className="relative w-48 h-48 rounded-xl overflow-hidden bg-white p-2 border border-white/10 shadow-lg">
                              <Image
                                src={settings.qrPayment.esewaQrImageUrl}
                                alt="eSewa QR Code"
                                fill
                                className="object-contain p-1"
                              />
                            </div>
                          ) : (
                            <div className="w-48 h-48 rounded-xl bg-white/5 border border-dashed border-white/20 flex flex-col items-center justify-center p-4 text-gray-400 text-xs">
                              <QrCode className="w-12 h-12 text-[#60bb46] mb-2 opacity-80" />
                              <span>Scan with eSewa App</span>
                              <span className="font-semibold text-white mt-1">
                                {settings.qrPayment.esewaId || "9800000000"}
                              </span>
                            </div>
                          )
                        ) : settings.qrPayment.bankQrImageUrl ? (
                          <div className="relative w-48 h-48 rounded-xl overflow-hidden bg-white p-2 border border-white/10 shadow-lg">
                            <Image
                              src={settings.qrPayment.bankQrImageUrl}
                              alt="Bank QR Code"
                              fill
                              className="object-contain p-1"
                            />
                          </div>
                        ) : (
                          <div className="w-48 h-48 rounded-xl bg-white/5 border border-dashed border-white/20 flex flex-col items-center justify-center p-4 text-gray-400 text-xs">
                            <Building2 className="w-12 h-12 text-purple-400 mb-2 opacity-80" />
                            <span>Mobile Banking QR</span>
                            <span className="font-semibold text-white mt-1">
                              {settings.qrPayment.bankName}
                            </span>
                          </div>
                        )}
                        <p className="text-xs text-gray-400 mt-3">
                          Scan to pay exact total:{" "}
                          <span className="text-white font-bold">{formatPrice(finalTotal)}</span>
                        </p>
                      </div>

                      {/* Right: Account details */}
                      <div className="space-y-3">
                        {qrTab === "bank" ? (
                          <>
                            <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                              <span className="text-xs text-gray-400 block">Bank Name</span>
                              <span className="text-sm font-semibold text-white">
                                {settings.qrPayment.bankName}
                              </span>
                            </div>
                            <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                              <span className="text-xs text-gray-400 block">Account Name</span>
                              <span className="text-sm font-semibold text-white">
                                {settings.qrPayment.accountName}
                              </span>
                            </div>
                            <div className="bg-black/30 p-3 rounded-xl border border-white/5 flex items-center justify-between">
                              <div>
                                <span className="text-xs text-gray-400 block">Account Number</span>
                                <span className="text-sm font-mono font-bold text-purple-300">
                                  {settings.qrPayment.accountNumber}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  copyToClipboard(settings.qrPayment.accountNumber, "acct")
                                }
                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition-colors"
                              >
                                {copiedKey === "acct" ? (
                                  <Check className="w-4 h-4 text-green-400" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                            {settings.qrPayment.branch && (
                              <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                                <span className="text-xs text-gray-400 block">Branch</span>
                                <span className="text-xs text-white">
                                  {settings.qrPayment.branch}
                                </span>
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                              <span className="text-xs text-gray-400 block">eSewa Merchant/ID</span>
                              <div className="flex items-center justify-between mt-0.5">
                                <span className="text-base font-bold text-[#60bb46]">
                                  {settings.qrPayment.esewaId || "9800000000"}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    copyToClipboard(
                                      settings.qrPayment.esewaId || "9800000000",
                                      "esewaId"
                                    )
                                  }
                                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition-colors"
                                >
                                  {copiedKey === "esewaId" ? (
                                    <Check className="w-4 h-4 text-green-400" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            </div>
                            <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                              <span className="text-xs text-gray-400 block">Receiver Name</span>
                              <span className="text-sm font-semibold text-white">
                                {settings.qrPayment.accountName}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Custom Admin Instructions */}
                    {settings.qrPayment.instructions && (
                      <div className="p-3 bg-purple-900/20 rounded-xl border border-purple-500/20 text-xs text-gray-300">
                        <span className="text-purple-300 font-semibold block mb-0.5">
                          Instructions:
                        </span>
                        {settings.qrPayment.instructions}
                      </div>
                    )}

                    {/* Proof Upload Area */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                          <span>Upload Proof of Payment (Screenshot or PDF)</span>
                          <span className="text-red-400">*</span>
                        </label>
                        <span className="text-[11px] text-gray-500">Max 15MB</span>
                      </div>

                      {!proofFile ? (
                        <label className="border-2 border-dashed border-purple-500/30 hover:border-purple-500/60 bg-white/2 hover:bg-white/5 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all">
                          <UploadCloud className="w-8 h-8 text-purple-400 mb-2" />
                          <p className="text-sm font-medium text-white text-center">
                            Click or drag screenshot or PDF payment slip
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            PNG, JPG, WebP, or PDF receipts accepted
                          </p>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>
                      ) : (
                        <div className="p-4 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            {proofPreview ? (
                              <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-white/5 border border-white/10">
                                <Image
                                  src={proofPreview}
                                  alt="Proof Preview"
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center flex-shrink-0 border border-red-500/30">
                                <FileText className="w-6 h-6" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-white truncate">
                                {proofFile.name}
                              </p>
                              <p className="text-[11px] text-gray-400">
                                {(proofFile.size / 1024).toFixed(1)} KB • {proofFile.type}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={removeProofFile}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">
                          Transaction ID / Reference Number (Optional)
                        </label>
                        <input
                          type="text"
                          value={transactionRef}
                          onChange={(e) => setTransactionRef(e.target.value)}
                          placeholder="e.g. eSewa Txn ID or Bank UTR"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Order Summary & Place Order */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass rounded-2xl p-6 border border-white/5 space-y-5 sticky top-24">
            <h2 className="text-base font-semibold text-white flex items-center gap-2 border-b border-white/5 pb-3">
              <ShoppingBag className="w-5 h-5 text-purple-400" />
              Order Summary ({items.length} item{items.length > 1 ? "s" : ""})
            </h2>

            {/* Cart Items list */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {items.map((item) => (
                <div
                  key={`${item.productId}-${item.variantName}`}
                  className="flex gap-3 p-2.5 rounded-xl bg-white/2 border border-white/5"
                >
                  {item.imageUrl && (
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-900">
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">{item.title}</p>
                    {item.variantName && (
                      <p className="text-[11px] text-gray-500">{item.variantName}</p>
                    )}
                    <p className="text-[11px] text-gray-400">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-xs font-semibold text-white">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            {/* Price breakdown */}
            <div className="border-t border-white/5 pt-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Subtotal</span>
                <span className="text-white font-medium">{formatPrice(totalPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Shipping</span>
                <span className={shippingFee === 0 ? "text-green-400 font-semibold" : "text-white"}>
                  {shippingFee === 0 ? "Free" : formatPrice(shippingFee)}
                </span>
              </div>
              <div className="border-t border-white/5 pt-3 flex justify-between text-base font-bold">
                <span className="text-white">Total</span>
                <span className="gradient-text">{formatPrice(finalTotal)}</span>
              </div>
            </div>

            {/* Action button */}
            <button
              onClick={handleCheckout}
              disabled={isSubmitting || loadingSettings}
              className="btn-primary w-full py-3.5 text-sm font-semibold flex items-center justify-center gap-2 shadow-lg transition-all"
              style={
                paymentMethod === "ESEWA"
                  ? { background: "linear-gradient(135deg, #60bb46 0%, #3d8c2f 100%)" }
                  : { background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)" }
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Order...</span>
                </>
              ) : paymentMethod === "ESEWA" ? (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Pay with eSewa ({formatPrice(finalTotal)})</span>
                </>
              ) : paymentMethod === "QR_CODE" ? (
                <>
                  <QrCode className="w-4 h-4" />
                  <span>Place Order & Submit Proof</span>
                </>
              ) : (
                <>
                  <Truck className="w-4 h-4" />
                  <span>Confirm Cash on Delivery</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
              <Lock className="w-3.5 h-3.5" />
              <span>Safe & encrypted checkout</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
