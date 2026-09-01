"use client";

import { useCartStore } from "@/store/cartStore";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { ShoppingBag, Loader2, Lock } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";

export default function CheckoutPage() {
  const { items, getTotalPrice, clearCart } = useCartStore();
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const totalPrice = getTotalPrice();

  useEffect(() => {
    if (items.length === 0) {
      router.push("/products");
    }
  }, [items.length, router]);

  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/checkout", {
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
          userId: session?.user?.id,
          userEmail: session?.user?.email,
        }),
      });

      if (!res.ok) throw new Error("Failed to create checkout session");

      const { url, payload } = await res.json();

      // Build and submit an HTML form to eSewa's payment gateway
      const form = document.createElement("form");
      form.method = "POST";
      form.action = url;

      Object.entries(payload as Record<string, string>).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      toast.error("Checkout failed. Please try again.");
      setIsLoading(false);
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="section-title text-white mb-10">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order summary */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-white mb-4">Order Summary</h2>
          {items.map((item) => (
            <div
              key={`${item.productId}-${item.variantName}`}
              className="flex gap-4 p-4 glass rounded-xl"
            >
              {item.imageUrl && (
                <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                  <Image src={item.imageUrl} alt={item.title} fill className="object-cover" />
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{item.title}</p>
                {item.variantName && (
                  <p className="text-xs text-gray-500 mt-0.5">{item.variantName}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">Qty: {item.quantity}</p>
              </div>
              <p className="text-sm font-semibold text-white">
                {formatPrice(item.price * item.quantity)}
              </p>
            </div>
          ))}
        </div>

        {/* Total & CTA */}
        <div className="glass rounded-2xl p-6 h-fit space-y-4 sticky top-24">
          <h2 className="text-lg font-semibold text-white">Payment Summary</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Subtotal</span>
              <span className="text-white">{formatPrice(totalPrice)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Shipping</span>
              <span className={totalPrice >= 100 ? "text-green-400" : "text-white"}>
                {totalPrice >= 100 ? "Free" : formatPrice(9.99)}
              </span>
            </div>
            <div className="border-t border-white/5 pt-2 flex justify-between font-semibold">
              <span className="text-white">Total</span>
              <span className="text-lg gradient-text">
                {formatPrice(totalPrice + (totalPrice >= 100 ? 0 : 9.99))}
              </span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={isLoading}
            className="btn-primary w-full py-3.5 text-base"
            style={{ background: "linear-gradient(135deg, #60bb46 0%, #3d8c2f 100%)" }}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Pay with eSewa
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
            <Lock className="w-3 h-3" />
            Secured by eSewa — 256-bit SSL
          </div>
        </div>
      </div>
    </div>
  );
}
