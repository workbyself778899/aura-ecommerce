"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Star, Eye, Heart } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { formatPrice, getCoverImage, truncate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { IProduct } from "@/types";
import toast from "react-hot-toast";

interface ProductCardProps {
  product: IProduct;
  index?: number;
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { addItem } = useCartStore();

  const coverImage = getCoverImage(product.images);
  const discount =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(
          ((product.compareAtPrice - product.price) / product.compareAtPrice) * 100
        )
      : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (product.stockQuantity === 0) {
      toast.error("Out of stock");
      return;
    }

    addItem({
      productId: product._id,
      title: product.title,
      price: product.price,
      quantity: 1,
      imageUrl: coverImage,
      slug: product.slug,
    });

    toast.success(`${truncate(product.title, 30)} added to cart`, {
      icon: "🛍️",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group"
    >
      <Link href={`/products/${product.slug}`} className="block">
        <div className="card-hover bg-[var(--bg-card)] rounded-2xl overflow-hidden border border-[var(--border-subtle)] hover:border-[var(--border-default)]">
          {/* Image */}
          <div className="relative aspect-square bg-gray-900 overflow-hidden">
            {coverImage ? (
              <Image
                src={coverImage}
                alt={product.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900/40 to-gray-900">
                <ShoppingCart className="w-12 h-12 text-gray-700" />
              </div>
            )}

            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              {discount && (
                <span className="badge bg-amber-500/90 text-black">
                  -{discount}%
                </span>
              )}
              {product.isFeatured && (
                <span className="badge bg-purple-600/90 text-white">
                  Featured
                </span>
              )}
              {product.stockQuantity === 0 && (
                <span className="badge bg-red-500/90 text-white">
                  Sold Out
                </span>
              )}
              {product.stockQuantity > 0 && product.stockQuantity <= 5 && (
                <span className="badge bg-orange-500/90 text-white">
                  Only {product.stockQuantity} left
                </span>
              )}
            </div>

            {/* Hover actions */}
            <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-4 group-hover:translate-x-0">
              <button
                className="w-9 h-9 bg-black/60 backdrop-blur rounded-full flex items-center justify-center text-gray-300 hover:text-red-400 transition-colors"
                onClick={(e) => { e.preventDefault(); }}
              >
                <Heart className="w-4 h-4" />
              </button>
              <Link
                href={`/products/${product.slug}`}
                className="w-9 h-9 bg-black/60 backdrop-blur rounded-full flex items-center justify-center text-gray-300 hover:text-purple-400 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Eye className="w-4 h-4" />
              </Link>
            </div>

            {/* Quick add to cart */}
            <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
              <button
                onClick={handleAddToCart}
                disabled={product.stockQuantity === 0}
                className={cn(
                  "w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all",
                  product.stockQuantity > 0
                    ? "btn-primary"
                    : "bg-gray-700 text-gray-400 cursor-not-allowed"
                )}
              >
                <ShoppingCart className="w-4 h-4" />
                {product.stockQuantity > 0 ? "Quick Add" : "Out of Stock"}
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="p-4">
            {product.category && (
              <p className="text-xs text-purple-400 font-medium mb-1 uppercase tracking-wider">
                {product.category.name}
              </p>
            )}
            <h3 className="text-sm font-semibold text-white leading-snug line-clamp-2 group-hover:text-purple-300 transition-colors">
              {product.title}
            </h3>

            {/* Rating */}
            {(product.reviewCount ?? 0) > 0 && (
              <div className="flex items-center gap-1.5 mt-2">

                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "w-3 h-3",
                        i < Math.round(product.avgRating ?? 0)
                          ? "star-filled fill-current"
                          : "star-empty"
                      )}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-500">
                  ({product.reviewCount})
                </span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-base font-bold gradient-text">
                {formatPrice(product.price)}
              </span>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <span className="text-sm text-gray-500 line-through">
                  {formatPrice(product.compareAtPrice)}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
