"use client";

import { useState } from "react";
import { useCartStore } from "@/store/cartStore";
import { ShoppingCart, Heart, Share2, Star, ChevronLeft, ChevronRight, Minus, Plus, Package, Shield, RefreshCw } from "lucide-react";
import Image from "next/image";
import { formatPrice, cn } from "@/lib/utils";
import type { IProduct } from "@/types";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

interface ProductDetailClientProps {
  product: IProduct;
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const { addItem } = useCartStore();
  const [activeImage, setActiveImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"description" | "specs" | "reviews">("description");

  const coverImage = product.images.find((i) => i.isCover) ?? product.images[0];
  const currentImage = product.images[activeImage];

  const handleAddToCart = () => {
    if (product.stockQuantity === 0) {
      toast.error("This product is out of stock");
      return;
    }

    addItem({
      productId: product._id,
      title: product.title,
      price: product.price,
      quantity,
      imageUrl: coverImage?.url,
      slug: product.slug,
      variantName: selectedVariant ?? undefined,
    });

    toast.success(`Added ${quantity}× to cart`, { icon: "🛍️" });
  };

  const isInStock = product.stockQuantity > 0;
  const lowStock = product.stockQuantity > 0 && product.stockQuantity <= 10;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
      {/* Image Gallery */}
      <div className="sticky top-24 space-y-4">
        {/* Main image */}
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-900">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0"
            >
              {currentImage ? (
                <Image
                  src={currentImage.url}
                  alt={product.title}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-20 h-20 text-gray-700" />
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Nav arrows */}
          {product.images.length > 1 && (
            <>
              <button
                onClick={() =>
                  setActiveImage((prev) =>
                    prev === 0 ? product.images.length - 1 : prev - 1
                  )
                }
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white hover:bg-black/70 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() =>
                  setActiveImage((prev) =>
                    prev === product.images.length - 1 ? 0 : prev + 1
                  )
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white hover:bg-black/70 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Thumbnails */}
        {product.images.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-1">
            {product.images.map((img, i) => (
              <button
                key={img.fileId}
                onClick={() => setActiveImage(i)}
                className={cn(
                  "relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all",
                  i === activeImage
                    ? "border-purple-500 scale-105"
                    : "border-transparent hover:border-gray-600"
                )}
              >
                <Image
                  src={img.thumbnailUrl || img.url}
                  alt={`${product.title} ${i + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="space-y-6">
        {/* Category */}
        {product.category && (
          <p className="text-sm text-purple-400 font-medium uppercase tracking-wider">
            {product.category.name}
          </p>
        )}

        <h1 className="text-3xl font-bold text-white leading-tight">
          {product.title}
        </h1>

        {/* Rating */}
        {(product.reviewCount ?? 0) > 0 && (
          <div className="flex items-center gap-2">

            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "w-4 h-4",
                    i < Math.round(product.avgRating ?? 0)
                      ? "star-filled fill-current"
                      : "star-empty"
                  )}
                />
              ))}
            </div>
            <span className="text-sm text-gray-400">
              {product.avgRating?.toFixed(1)} ({product.reviewCount} reviews)
            </span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-3">
          <span className="text-4xl font-bold gradient-text">
            {formatPrice(product.price)}
          </span>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="text-xl text-gray-500 line-through">
              {formatPrice(product.compareAtPrice)}
            </span>
          )}
        </div>

        {/* Stock status */}
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-2 h-2 rounded-full",
              isInStock ? "bg-green-400" : "bg-red-500"
            )}
          />
          <span className={cn("text-sm font-medium", isInStock ? "text-green-400" : "text-red-400")}>
            {isInStock
              ? lowStock
                ? `Only ${product.stockQuantity} left in stock!`
                : "In Stock"
              : "Out of Stock"}
          </span>
        </div>

        {/* Variants */}
        {product.variants.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-400 mb-3">Variants</p>
            <div className="flex flex-wrap gap-2">
              {product.variants.map((variant) => (
                <button
                  key={variant.sku}
                  onClick={() =>
                    setSelectedVariant(
                      selectedVariant === variant.name ? null : variant.name
                    )
                  }
                  className={cn(
                    "px-4 py-2 rounded-lg border text-sm font-medium transition-all",
                    selectedVariant === variant.name
                      ? "border-purple-500 bg-purple-500/15 text-purple-300"
                      : "border-gray-700 text-gray-300 hover:border-purple-600/50"
                  )}
                >
                  {variant.name}
                  {variant.price !== product.price && (
                    <span className="ml-1 text-xs text-gray-500">
                      +{formatPrice(variant.price - product.price)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quantity */}
        <div>
          <p className="text-sm font-medium text-gray-400 mb-3">Quantity</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-10 h-10 rounded-xl border border-gray-700 flex items-center justify-center text-gray-300 hover:border-purple-600/50 hover:text-white transition-all"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-lg font-semibold text-white w-8 text-center">
              {quantity}
            </span>
            <button
              onClick={() =>
                setQuantity(Math.min(product.stockQuantity, quantity + 1))
              }
              className="w-10 h-10 rounded-xl border border-gray-700 flex items-center justify-center text-gray-300 hover:border-purple-600/50 hover:text-white transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Add to cart */}
        <div className="flex gap-3">
          <button
            onClick={handleAddToCart}
            disabled={!isInStock}
            className={cn(
              "flex-1 py-3.5 rounded-xl text-base font-semibold flex items-center justify-center gap-2 transition-all",
              isInStock
                ? "btn-primary"
                : "bg-gray-800 text-gray-500 cursor-not-allowed"
            )}
          >
            <ShoppingCart className="w-5 h-5" />
            {isInStock ? "Add to Cart" : "Out of Stock"}
          </button>
          <button className="w-12 h-[54px] rounded-xl border border-gray-700 flex items-center justify-center text-gray-400 hover:text-red-400 hover:border-red-500/40 transition-all">
            <Heart className="w-5 h-5" />
          </button>
          <button className="w-12 h-[54px] rounded-xl border border-gray-700 flex items-center justify-center text-gray-400 hover:text-purple-400 hover:border-purple-500/40 transition-all">
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        {/* Guarantees */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          {[
            { icon: Package, text: "Free Shipping over $100" },
            { icon: Shield, text: "2-Year Warranty" },
            { icon: RefreshCw, text: "30-Day Returns" },
          ].map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="flex flex-col items-center gap-2 p-3 glass rounded-xl text-center"
            >
              <Icon className="w-5 h-5 text-purple-400" />
              <p className="text-xs text-gray-400 leading-tight">{text}</p>
            </div>
          ))}
        </div>

        {/* SKU */}
        <p className="text-xs text-gray-600">SKU: {product.sku}</p>

        {/* Tabs */}
        <div className="border-t border-white/5 pt-6">
          <div className="flex gap-1 mb-5">
            {(["description", "specs", "reviews"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all",
                  activeTab === tab
                    ? "bg-purple-500/15 text-purple-300 border border-purple-500/30"
                    : "text-gray-400 hover:text-gray-200"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "description" && (
                <div
                  className="text-sm text-gray-400 leading-relaxed space-y-3 prose-invert"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              )}
              {activeTab === "specs" && (
                <div className="space-y-2">
                  {[
                    { label: "SKU", value: product.sku },
                    { label: "Category", value: product.category?.name ?? "—" },
                    { label: "Stock", value: String(product.stockQuantity) },
                    ...(product.variants.length > 0
                      ? [{ label: "Variants", value: product.variants.map((v) => v.name).join(", ") }]
                      : []),
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between py-2.5 border-b border-white/5 text-sm">
                      <span className="text-gray-500">{label}</span>
                      <span className="text-gray-200 font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              )}
              {activeTab === "reviews" && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  Reviews coming soon. Be the first to review this product!
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
