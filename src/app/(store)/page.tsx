import { Metadata } from "next";
import HeroSection from "@/components/store/HeroSection";
import ProductCard from "@/components/ui/ProductCard";
import { getFeaturedProducts } from "@/actions/products";
import { getCategories } from "@/actions/categories";
import Link from "next/link";
import { ArrowRight, Grid3X3 } from "lucide-react";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Aura Commerce — Premium Shopping Experience",
  description:
    "Discover curated premium products. Shop fashion, electronics, home decor, and more.",
};

export default async function HomePage() {
  const [featuredProducts, categories] = await Promise.all([
    getFeaturedProducts(8),
    getCategories(),
  ]);

  return (
    <>
      {/* Hero */}
      <HeroSection />

      {/* Categories */}
      {categories.length > 0 && (
        <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-sm text-purple-400 font-medium uppercase tracking-wider mb-2">
                Browse
              </p>
              <h2 className="section-title text-white">Shop by Category</h2>
            </div>
            <Link
              href="/products"
              className="hidden sm:flex items-center gap-1.5 text-sm text-gray-400 hover:text-purple-400 transition-colors"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {categories.slice(0, 6).map((cat) => (
              <Link
                key={cat._id}
                href={`/products?category=${cat.slug}`}
                className="group flex flex-col items-center gap-3 p-5 glass rounded-2xl border border-[var(--border-subtle)] hover:border-[var(--border-default)] card-hover text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-900/60 to-gray-900 flex items-center justify-center overflow-hidden">
                  {cat.imageUrl ? (
                    <Image
                      src={cat.imageUrl}
                      alt={cat.name}
                      width={64}
                      height={64}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <Grid3X3 className="w-7 h-7 text-purple-400" />
                  )}
                </div>
                <span className="text-sm font-medium text-gray-200 group-hover:text-purple-300 transition-colors">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-sm text-purple-400 font-medium uppercase tracking-wider mb-2">
                Hand-Picked
              </p>
              <h2 className="section-title text-white">Featured Products</h2>
            </div>
            <Link
              href="/products?isFeatured=true"
              className="hidden sm:flex items-center gap-1.5 text-sm text-gray-400 hover:text-purple-400 transition-colors"
            >
              See all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {featuredProducts.map((product, i) => (
              <ProductCard key={product._id} product={product} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* CTA Banner */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden p-12 text-center">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900" />
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_rgba(168,85,247,0.8)_0%,_transparent_70%)]" />
            <div className="relative z-10">
              <h2 className="section-title text-white mb-4">
                Ready to Upgrade Your Lifestyle?
              </h2>
              <p className="text-gray-300 mb-8 max-w-lg mx-auto">
                Join over 50,000 customers who trust Aura Commerce for their
                premium shopping needs.
              </p>
              <Link href="/products" className="btn-primary text-base px-10 py-3.5 inline-flex">
                Explore All Products
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Aura Commerce",
            url: process.env.NEXT_PUBLIC_APP_URL,
            potentialAction: {
              "@type": "SearchAction",
              target: `${process.env.NEXT_PUBLIC_APP_URL}/products?search={search_term_string}`,
              "query-input": "required name=search_term_string",
            },
          }),
        }}
      />
    </>
  );
}
