"use client";

import { useEffect } from "react";
import { useCartStore } from "@/store/cartStore";
import Link from "next/link";
import { CheckCircle2, ArrowRight, Package } from "lucide-react";
import { motion } from "framer-motion";

export default function CheckoutSuccessPage() {
  const { clearCart } = useCartStore();

  useEffect(() => {
    // Clear shopping cart on successful checkout
    clearCart();
  }, [clearCart]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="glass rounded-3xl p-10 max-w-md text-center border border-green-500/30 space-y-6"
      >
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto text-green-400">
          <CheckCircle2 className="w-12 h-12" />
        </div>

        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Payment Successful!</h1>
          <p className="text-gray-400 text-sm">
            Thank you for shopping with Aura Commerce. Your order has been placed and is now being processed.
          </p>
        </div>

        <div className="p-4 bg-purple-900/20 rounded-2xl border border-purple-500/20 text-left space-y-2">
          <div className="flex items-center gap-2 text-xs text-purple-300 font-semibold">
            <Package className="w-4 h-4" />
            What happens next?
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">
            We sent a confirmation email with details to your inbox. You can track fulfillment status anytime in your orders tab.
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <Link href="/account/orders" className="btn-primary py-3">
            View My Orders
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/products" className="text-sm text-gray-400 hover:text-white transition-colors">
            Continue Shopping
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
