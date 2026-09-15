"use client";

import { useEffect, useState } from "react";
import {
  getAdminPaymentSettings,
  updatePaymentSettings,
} from "@/actions/payments";
import type { IPaymentSettings } from "@/types";
import {
  CreditCard,
  QrCode,
  Building2,
  Save,
  Loader2,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Info,
  Truck,
  Image as ImageIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import Image from "next/image";

export default function AdminPaymentSettingsPage() {
  const [settings, setSettings] = useState<IPaymentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingQr, setUploadingQr] = useState<"bank" | "esewa" | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getAdminPaymentSettings();
        setSettings(data);
      } catch (err) {
        toast.error("Failed to load payment settings");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleQrUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "bank" | "esewa"
  ) => {
    const file = e.target.files?.[0];
    if (!file || !settings) return;

    setUploadingQr(type);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("fileName", `${type}-qr-${Date.now()}`);

    try {
      const res = await fetch("/api/payment-proof/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();

      if (type === "bank") {
        setSettings({
          ...settings,
          qrPayment: {
            ...settings.qrPayment,
            bankQrImageUrl: data.fileUrl,
          },
        });
      } else {
        setSettings({
          ...settings,
          qrPayment: {
            ...settings.qrPayment,
            esewaQrImageUrl: data.fileUrl,
          },
        });
      }
      toast.success(`${type === "bank" ? "Bank" : "eSewa"} QR image updated!`);
    } catch (err) {
      toast.error("Failed to upload QR image");
    } finally {
      setUploadingQr(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    try {
      const res = await updatePaymentSettings({
        esewa: settings.esewa,
        qrPayment: settings.qrPayment,
        cashOnDelivery: settings.cashOnDelivery,
      });

      if (res.success) {
        toast.success("Payment settings updated successfully!");
      } else {
        toast.error(res.error || "Failed to update settings");
      }
    } catch (err) {
      toast.error("Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-gray-400 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
        <span>Loading payment configuration...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <CreditCard className="w-6 h-6 text-purple-400" />
            Payment Gateway & Channels
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Enable or disable eSewa, configure bank & eSewa QR codes, and manage customer payment instructions.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="btn-primary px-6 py-2.5 flex items-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>

      {/* Notice */}
      <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/20 text-xs text-gray-300 flex items-start gap-3">
        <Info className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Toggling these options takes effect immediately across customer checkout. When eSewa is disabled,
          customers will not see the eSewa wallet option. When QR payment is enabled, customers can scan your QR
          and upload their screenshot/PDF proof.
        </p>
      </div>

      {/* 1. eSewa Section */}
      <div className="glass rounded-2xl p-6 border border-white/5 space-y-6">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#60bb46] flex items-center justify-center font-black text-white text-lg shadow-md shadow-[#60bb46]/20">
              e
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">eSewa Payment Gateway</h2>
              <p className="text-xs text-gray-400">Accept automated eSewa digital wallet payments</p>
            </div>
          </div>

          {/* Toggle Switch */}
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.esewa.enabled}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  esewa: { ...settings.esewa, enabled: e.target.checked },
                })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#60bb46]"></div>
            <span className="ml-3 text-xs font-semibold text-white">
              {settings.esewa.enabled ? (
                <span className="text-green-400">Enabled</span>
              ) : (
                <span className="text-gray-400">Disabled</span>
              )}
            </span>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">
              eSewa Merchant Product Code
            </label>
            <input
              type="text"
              value={settings.esewa.productCode}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  esewa: { ...settings.esewa, productCode: e.target.value },
                })
              }
              placeholder="EPAYTEST"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#60bb46]"
            />
            <p className="text-[11px] text-gray-500 mt-1">Use EPAYTEST for sandbox testing</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">
              eSewa Secret Key
            </label>
            <input
              type="password"
              value={settings.esewa.secretKey}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  esewa: { ...settings.esewa, secretKey: e.target.value },
                })
              }
              placeholder="8gBm/:&EnhH.1/q"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#60bb46]"
            />
            <p className="text-[11px] text-gray-500 mt-1">Secret HMAC-SHA256 key from merchant panel</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">
              Payment Form URL
            </label>
            <input
              type="text"
              value={settings.esewa.paymentUrl}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  esewa: { ...settings.esewa, paymentUrl: e.target.value },
                })
              }
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-gray-300 placeholder-gray-500 focus:outline-none focus:border-[#60bb46]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">
              Status Verification URL
            </label>
            <input
              type="text"
              value={settings.esewa.statusUrl}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  esewa: { ...settings.esewa, statusUrl: e.target.value },
                })
              }
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-gray-300 placeholder-gray-500 focus:outline-none focus:border-[#60bb46]"
            />
          </div>
        </div>
      </div>

      {/* 2. QR Code / Bank Transfer Section */}
      <div className="glass rounded-2xl p-6 border border-white/5 space-y-6">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">QR Code & Bank Transfer Payment</h2>
              <p className="text-xs text-gray-400">
                Display Bank/eSewa QR codes & receive screenshot/PDF proof from customers
              </p>
            </div>
          </div>

          {/* Toggle Switch */}
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.qrPayment.enabled}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  qrPayment: { ...settings.qrPayment, enabled: e.target.checked },
                })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            <span className="ml-3 text-xs font-semibold text-white">
              {settings.qrPayment.enabled ? (
                <span className="text-purple-400">Enabled</span>
              ) : (
                <span className="text-gray-400">Disabled</span>
              )}
            </span>
          </label>
        </div>

        {/* QR Code Uploads */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl bg-black/20 border border-white/5">
          {/* Bank QR */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-400" />
              Bank QR Code Image
            </label>
            <div className="flex items-center gap-4">
              {settings.qrPayment.bankQrImageUrl ? (
                <div className="relative w-28 h-28 rounded-xl overflow-hidden bg-white p-1 border border-white/10 flex-shrink-0">
                  <Image
                    src={settings.qrPayment.bankQrImageUrl}
                    alt="Bank QR"
                    fill
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="w-28 h-28 rounded-xl bg-white/5 border border-dashed border-white/20 flex flex-col items-center justify-center text-gray-500 text-xs flex-shrink-0">
                  <ImageIcon className="w-6 h-6 mb-1" />
                  <span>No QR</span>
                </div>
              )}

              <div className="space-y-2 flex-1 min-w-0">
                <label className="btn-secondary px-3 py-2 text-xs flex items-center gap-1.5 cursor-pointer w-fit">
                  {uploadingQr === "bank" ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  <span>Upload Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleQrUpload(e, "bank")}
                    className="hidden"
                  />
                </label>
                <input
                  type="text"
                  value={settings.qrPayment.bankQrImageUrl || ""}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      qrPayment: { ...settings.qrPayment, bankQrImageUrl: e.target.value },
                    })
                  }
                  placeholder="Or paste QR Image URL"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500"
                />
              </div>
            </div>
          </div>

          {/* eSewa QR */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-white flex items-center gap-2">
              <QrCode className="w-4 h-4 text-[#60bb46]" />
              eSewa QR Code Image
            </label>
            <div className="flex items-center gap-4">
              {settings.qrPayment.esewaQrImageUrl ? (
                <div className="relative w-28 h-28 rounded-xl overflow-hidden bg-white p-1 border border-white/10 flex-shrink-0">
                  <Image
                    src={settings.qrPayment.esewaQrImageUrl}
                    alt="eSewa QR"
                    fill
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="w-28 h-28 rounded-xl bg-white/5 border border-dashed border-white/20 flex flex-col items-center justify-center text-gray-500 text-xs flex-shrink-0">
                  <ImageIcon className="w-6 h-6 mb-1" />
                  <span>No QR</span>
                </div>
              )}

              <div className="space-y-2 flex-1 min-w-0">
                <label className="btn-secondary px-3 py-2 text-xs flex items-center gap-1.5 cursor-pointer w-fit">
                  {uploadingQr === "esewa" ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  <span>Upload Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleQrUpload(e, "esewa")}
                    className="hidden"
                  />
                </label>
                <input
                  type="text"
                  value={settings.qrPayment.esewaQrImageUrl || ""}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      qrPayment: { ...settings.qrPayment, esewaQrImageUrl: e.target.value },
                    })
                  }
                  placeholder="Or paste QR Image URL"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bank & eSewa Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">
              Bank Name
            </label>
            <input
              type="text"
              value={settings.qrPayment.bankName}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  qrPayment: { ...settings.qrPayment, bankName: e.target.value },
                })
              }
              placeholder="e.g. Nabil Bank"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">
              Account Holder Name
            </label>
            <input
              type="text"
              value={settings.qrPayment.accountName}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  qrPayment: { ...settings.qrPayment, accountName: e.target.value },
                })
              }
              placeholder="e.g. Aura Commerce Pvt. Ltd."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">
              Bank Account Number
            </label>
            <input
              type="text"
              value={settings.qrPayment.accountNumber}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  qrPayment: { ...settings.qrPayment, accountNumber: e.target.value },
                })
              }
              placeholder="e.g. 01234567890123"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-mono text-purple-300 placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">
              eSewa ID / Registered Mobile Number
            </label>
            <input
              type="text"
              value={settings.qrPayment.esewaId || ""}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  qrPayment: { ...settings.qrPayment, esewaId: e.target.value },
                })
              }
              placeholder="e.g. 9800000000"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-mono text-[#60bb46] placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-300 mb-1.5">
              Branch Name
            </label>
            <input
              type="text"
              value={settings.qrPayment.branch || ""}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  qrPayment: { ...settings.qrPayment, branch: e.target.value },
                })
              }
              placeholder="e.g. Main Branch, Kathmandu"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-300 mb-1.5">
              Payment Instructions for Customer
            </label>
            <textarea
              rows={3}
              value={settings.qrPayment.instructions || ""}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  qrPayment: { ...settings.qrPayment, instructions: e.target.value },
                })
              }
              placeholder="Special instructions displayed on the checkout page..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>
      </div>

      {/* 3. Cash On Delivery */}
      <div className="glass rounded-2xl p-6 border border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Cash on Delivery (COD)</h2>
            <p className="text-xs text-gray-400">Allow customers to pay in cash upon receiving package</p>
          </div>
        </div>

        {/* Toggle Switch */}
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.cashOnDelivery?.enabled ?? false}
            onChange={(e) =>
              setSettings({
                ...settings,
                cashOnDelivery: { enabled: e.target.checked },
              })
            }
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
          <span className="ml-3 text-xs font-semibold text-white">
            {settings.cashOnDelivery?.enabled ? (
              <span className="text-amber-400">Enabled</span>
            ) : (
              <span className="text-gray-400">Disabled</span>
            )}
          </span>
        </label>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={saving}
          className="btn-primary px-8 py-3 text-base flex items-center gap-2 shadow-xl shadow-purple-500/20"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Saving Changes...</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>Save Payment Settings</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
