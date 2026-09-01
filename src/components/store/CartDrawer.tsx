"use client";

import { useCartStore } from "@/store/cartStore";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, Plus, Minus, Trash2, Truck } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

const FREE_SHIPPING_THRESHOLD = 100;

export default function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    getTotalPrice,
    getTotalItems,
  } = useCartStore();

  const totalPrice = getTotalPrice();
  const totalItems = getTotalItems();
  const shippingProgress = Math.min((totalPrice / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const remainingForFreeShipping = Math.max(FREE_SHIPPING_THRESHOLD - totalPrice, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={closeCart}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md glass-strong flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-purple-400" />
                <h2 className="text-lg font-semibold text-white">
                  Cart ({totalItems})
                </h2>
              </div>
              <button
                onClick={closeCart}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Free shipping progress */}
            <div className="px-5 py-3 bg-purple-900/20 border-b border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <Truck className="w-4 h-4 text-purple-400" />
                {remainingForFreeShipping > 0 ? (
                  <p className="text-xs text-gray-300">
                    Add{" "}
                    <span className="text-purple-400 font-semibold">
                      {formatPrice(remainingForFreeShipping)}
                    </span>{" "}
                    more for free shipping
                  </p>
                ) : (
                  <p className="text-xs text-green-400 font-semibold">
                    🎉 You qualify for free shipping!
                  </p>
                )}
              </div>
              <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-600 to-amber-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${shippingProgress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                  <div className="w-20 h-20 rounded-full bg-purple-900/30 flex items-center justify-center">
                    <ShoppingBag className="w-10 h-10 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      Your cart is empty
                    </h3>
                    <p className="text-sm text-gray-400">
                      Discover amazing products and add them here.
                    </p>
                  </div>
                  <Link
                    href="/products"
                    onClick={closeCart}
                    className="btn-primary"
                  >
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {items.map((item) => (
                    <motion.div
                      key={`${item.productId}-${item.variantName}`}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 100, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                      className="flex gap-4 p-3 glass rounded-xl"
                    >
                      {/* Product image */}
                      <Link
                        href={`/products/${item.slug}`}
                        onClick={closeCart}
                        className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-800"
                      >
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="w-6 h-6 text-gray-600" />
                          </div>
                        )}
                      </Link>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/products/${item.slug}`}
                          onClick={closeCart}
                          className="text-sm font-medium text-white hover:text-purple-400 transition-colors line-clamp-1"
                        >
                          {item.title}
                        </Link>
                        {item.variantName && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {item.variantName}
                          </p>
                        )}
                        <p className="text-sm font-semibold gradient-text mt-1">
                          {formatPrice(item.price)}
                        </p>

                        {/* Quantity controls */}
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.productId,
                                item.quantity - 1,
                                item.variantName
                              )
                            }
                            className="w-6 h-6 rounded flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-sm text-white w-6 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.productId,
                                item.quantity + 1,
                                item.variantName
                              )
                            }
                            className="w-6 h-6 rounded flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() =>
                              removeItem(item.productId, item.variantName)
                            }
                            className="ml-auto p-1.5 text-gray-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-5 border-t border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Subtotal</span>
                  <span className="text-xl font-bold text-white">
                    {formatPrice(totalPrice)}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Taxes and shipping calculated at checkout
                </p>
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className={cn("btn-primary w-full text-base py-3")}
                >
                  Checkout → {formatPrice(totalPrice)}
                </Link>
                <button
                  onClick={closeCart}
                  className="w-full text-sm text-gray-400 hover:text-gray-200 transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
