import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug, getProducts } from "@/actions/products";
import ProductDetailClient from "@/components/store/ProductDetailClient";
import ProductCard from "@/components/ui/ProductCard";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface PDPProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PDPProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) return { title: "Product Not Found" };

  const coverImage = product.images.find((i) => i.isCover)?.url ?? product.images[0]?.url;

  return {
    title: product.title,
    description: product.description.replace(/<[^>]*>/g, "").slice(0, 160),
    openGraph: {
      title: product.title,
      description: product.description.replace(/<[^>]*>/g, "").slice(0, 160),
      images: coverImage ? [{ url: coverImage, width: 800, height: 800 }] : [],
      type: "website",
    },
  };
}

export default async function ProductDetailPage({ params }: PDPProps) {
  const { slug } = await params;

  const [product, { products: related }] = await Promise.all([
    getProductBySlug(slug),
    getProducts({ limit: 4, sort: "newest" }),
  ]);

  if (!product) notFound();

  const coverImage = product.images.find((i) => i.isCover)?.url ?? product.images[0]?.url;

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description.replace(/<[^>]*>/g, ""),
    image: coverImage,
    sku: product.sku,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "USD",
      availability:
        product.stockQuantity > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
    ...((product.reviewCount ?? 0) > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: product.avgRating,
        reviewCount: product.reviewCount,
      },
    }),

  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
        <Link href="/" className="hover:text-purple-400 transition-colors">Home</Link>
        <ChevronRight className="w-4 h-4" />
        <Link href="/products" className="hover:text-purple-400 transition-colors">Products</Link>
        {product.category && (
          <>
            <ChevronRight className="w-4 h-4" />
            <Link
              href={`/products?category=${product.category.slug}`}
              className="hover:text-purple-400 transition-colors"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-300 truncate max-w-[200px]">{product.title}</span>
      </nav>

      {/* Product detail */}
      <ProductDetailClient product={product} />

      {/* Related products */}
      {related.filter((p) => p._id !== product._id).length > 0 && (
        <section className="mt-20">
          <h2 className="section-title text-white mb-8">You May Also Like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {related
              .filter((p) => p._id !== product._id)
              .slice(0, 4)
              .map((p, i) => (
                <ProductCard key={p._id} product={p} index={i} />
              ))}
          </div>
        </section>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
