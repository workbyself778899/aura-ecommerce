"use client";

import { useEffect, Suspense } from "react";
import { useCartStore } from "@/store/cartStore";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, ArrowRight, Package, Clock, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

function SuccessContent() {
  const { clearCart } = useCartStore();
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber");
  const method = searchParams.get("method");

  useEffect(() => {
    // Clear shopping cart on successful checkout
    clearCart();
  }, [clearCart]);

  const isManualReview = method === "QR_CODE";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className={`glass rounded-3xl p-8 sm:p-10 max-w-lg text-center border ${
        isManualReview ? "border-amber-500/30" : "border-green-500/30"
      } space-y-6`}
    >
      <div
        className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${
          isManualReview
            ? "bg-amber-500/20 text-amber-400"
            : "bg-green-500/20 text-green-400"
        }`}
      >
        {isManualReview ? (
          <Clock className="w-12 h-12 animate-pulse" />
        ) : (
          <CheckCircle2 className="w-12 h-12" />
        )}
      </div>

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          {isManualReview ? "Order Placed & Under Review!" : "Payment Successful!"}
        </h1>
        {orderNumber && (
          <div className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-purple-300 mb-2">
            Order #{orderNumber}
          </div>
        )}
        <p className="text-gray-300 text-sm leading-relaxed">
          {isManualReview
            ? "Your proof of payment has been received. Our admin team will verify the transfer and confirm your order promptly."
            : "Thank you for shopping with Aura Commerce. Your transaction has been verified and your order is now being processed."}
        </p>
      </div>

      <div className="p-4 bg-purple-900/20 rounded-2xl border border-purple-500/20 text-left space-y-2">
        <div className="flex items-center gap-2 text-xs text-purple-300 font-semibold">
          {isManualReview ? (
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          ) : (
            <Package className="w-4 h-4 text-green-400" />
          )}
          {isManualReview ? "Verification Timeline" : "What happens next?"}
        </div>
        <p className="text-xs text-gray-300 leading-relaxed">
          {isManualReview
            ? "Manual QR/Bank verifications typically take 15–30 minutes during business hours. You can check the live status of your order in your account dashboard."
            : "We sent a confirmation email with all details to your inbox. You can track fulfillment status anytime in your orders tab."}
        </p>
      </div>

      <div className="flex flex-col gap-3 pt-2">
        <Link href="/account/orders" className="btn-primary py-3">
          View My Orders
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href="/products"
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    </motion.div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <Suspense
        fallback={
          <div className="glass rounded-3xl p-10 max-w-md text-center text-white">
            Loading order details...
          </div>
        }
      >
        <SuccessContent />
      </Suspense>
    </div>
  );
}
