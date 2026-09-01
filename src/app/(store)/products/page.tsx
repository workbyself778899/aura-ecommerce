import { Metadata } from "next";
import { Suspense } from "react";
import ProductCard from "@/components/ui/ProductCard";
import ProductFilters from "@/components/store/ProductFilters";
import { getProducts } from "@/actions/products";
import { getCategories } from "@/actions/categories";
import Link from "next/link";
import { ChevronLeft, ChevronRight, PackageX } from "lucide-react";
import type { ProductFilters as Filters } from "@/types";

export const metadata: Metadata = {
  title: "Shop All Products",
  description: "Browse our complete collection of premium products.",
};

interface ProductsPageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    inStock?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;

  const filters: Filters = {
    search: params.search,
    category: params.category,
    minPrice: params.minPrice ? Number(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
    inStock: params.inStock === "true",
    sort: (params.sort as Filters["sort"]) ?? "newest",
    page: params.page ? Number(params.page) : 1,
    limit: 12,
  };

  const [{ products, total, pages }, categories] = await Promise.all([
    getProducts(filters),
    getCategories(),
  ]);

  const currentPage = filters.page ?? 1;

  // Build pagination URL
  const buildPageUrl = (page: number) => {
    const p = new URLSearchParams(params as Record<string, string>);
    p.set("page", String(page));
    return `/products?${p.toString()}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="section-title text-white mb-2">
          {params.category ? `Shop ${params.category}` : "All Products"}
        </h1>
        <p className="text-gray-400 text-sm">
          {total} product{total !== 1 ? "s" : ""} found
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8">
        <Suspense>
          <ProductFilters categories={categories} />
        </Suspense>
      </div>

      {/* Products grid */}
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-20 h-20 rounded-full bg-purple-900/30 flex items-center justify-center">
            <PackageX className="w-10 h-10 text-purple-400" />
          </div>
          <h2 className="text-xl font-semibold text-white">No products found</h2>
          <p className="text-gray-400 text-sm">Try adjusting your filters or search terms.</p>
          <Link href="/products" className="btn-primary mt-2">
            Clear Filters
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product, i) => (
              <ProductCard key={product._id} product={product} index={i} />
            ))}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-12">
              <Link
                href={buildPageUrl(currentPage - 1)}
                className={`p-2.5 rounded-lg glass transition-colors ${
                  currentPage <= 1
                    ? "opacity-30 pointer-events-none"
                    : "hover:border-purple-500/50"
                }`}
              >
                <ChevronLeft className="w-5 h-5 text-gray-400" />
              </Link>

              {Array.from({ length: pages }, (_, i) => i + 1).map((page) => (
                <Link
                  key={page}
                  href={buildPageUrl(page)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-all ${
                    page === currentPage
                      ? "bg-gradient-to-br from-purple-600 to-amber-500 text-white shadow-lg"
                      : "glass text-gray-400 hover:text-white"
                  }`}
                >
                  {page}
                </Link>
              ))}

              <Link
                href={buildPageUrl(currentPage + 1)}
                className={`p-2.5 rounded-lg glass transition-colors ${
                  currentPage >= pages
                    ? "opacity-30 pointer-events-none"
                    : "hover:border-purple-500/50"
                }`}
              >
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
