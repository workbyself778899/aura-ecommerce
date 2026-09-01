"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  quality?: number;
  objectFit?: "cover" | "contain" | "fill";
  fallback?: string;
  showBlur?: boolean;
}

/**
 * Optimized image component backed by ImageKit transformation URLs.
 * Supports WebP auto-format, blur placeholder, and responsive sizes.
 */
export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className,
  priority = false,
  quality = 80,
  objectFit = "cover",
  fallback = "/placeholder-product.jpg",
  showBlur = true,
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState(src || fallback);
  const [isLoaded, setIsLoaded] = useState(false);

  // Build ImageKit URL with transformations
  const buildUrl = (src: string, w?: number): string => {
    const endpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;
    if (!endpoint || !src) return src;
    if (!src.includes(endpoint)) return src; // external URL

    // Extract path from full ImageKit URL
    const path = src.replace(endpoint, "");

    const transforms: string[] = [];
    if (w) transforms.push(`w-${w}`);
    transforms.push("f-webp");
    transforms.push(`q-${quality}`);

    return `${endpoint}/tr:${transforms.join(",")}${path}`;
  };

  const optimizedSrc = buildUrl(imgSrc, width);

  // Generate a blur placeholder URL (very low quality)
  const blurSrc = showBlur
    ? buildUrl(imgSrc, 20)
    : undefined;

  const imgProps = {
    src: optimizedSrc,
    alt,
    className: cn(
      "transition-opacity duration-500",
      isLoaded ? "opacity-100" : "opacity-0",
      className
    ),
    priority,
    quality,
    onLoad: () => setIsLoaded(true),
    onError: () => {
      setImgSrc(fallback);
      setIsLoaded(true);
    },
    ...(blurSrc && isLoaded === false
      ? { placeholder: "blur" as const, blurDataURL: blurSrc }
      : {}),
  };

  return (
    <div className={cn("relative overflow-hidden", !fill && "inline-block")}>
      {/* Skeleton while loading */}
      {!isLoaded && (
        <div
          className={cn("absolute inset-0 shimmer rounded")}
          aria-hidden="true"
        />
      )}

      {fill ? (
        <Image
          {...imgProps}
          alt={alt}
          fill
          style={{ objectFit }}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      ) : (
        <Image
          {...imgProps}
          alt={alt}
          width={width ?? 800}
          height={height ?? 600}
          style={{ objectFit }}
        />
      )}
    </div>
  );
}
