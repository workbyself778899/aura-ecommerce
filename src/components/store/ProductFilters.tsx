"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { Search, X, SlidersHorizontal, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ICategory } from "@/types";

interface ProductFiltersProps {
  categories: ICategory[];
}

export default function ProductFilters({ categories }: ProductFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") ?? ""
  );
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") ?? "");
  const [inStock, setInStock] = useState(searchParams.get("inStock") === "true");
  const [sort, setSort] = useState(searchParams.get("sort") ?? "newest");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 400);

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (selectedCategory) params.set("category", selectedCategory);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (inStock) params.set("inStock", "true");
    if (sort !== "newest") params.set("sort", sort);
    params.set("page", "1");
    return params.toString();
  }, [debouncedSearch, selectedCategory, minPrice, maxPrice, inStock, sort]);

  useEffect(() => {
    router.push(`${pathname}?${buildQuery()}`, { scroll: false });
  }, [buildQuery, pathname, router]);

  const clearAll = () => {
    setSearch("");
    setSelectedCategory("");
    setMinPrice("");
    setMaxPrice("");
    setInStock(false);
    setSort("newest");
  };

  const hasFilters =
    search || selectedCategory || minPrice || maxPrice || inStock || sort !== "newest";

  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "price_asc", label: "Price: Low to High" },
    { value: "price_desc", label: "Price: High to Low" },
    { value: "rating", label: "Top Rated" },
  ];

  return (
    <div className="space-y-4">
      {/* Search + Sort bar */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="input-field pl-9 pr-9"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sort */}
        <div className="relative">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="input-field pr-8 appearance-none cursor-pointer min-w-[160px]"
          >
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        </div>

        {/* Filters toggle */}
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all",
            filtersOpen
              ? "border-purple-500 bg-purple-500/10 text-purple-400"
              : "border-[var(--border-default)] text-gray-400 hover:border-purple-600/50 hover:text-gray-200"
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {hasFilters && (
            <span className="w-2 h-2 bg-amber-500 rounded-full" />
          )}
        </button>
      </div>

      {/* Expanded filters */}
      {filtersOpen && (
        <div className="glass rounded-xl p-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Category */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
                Category
              </label>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="radio"
                    name="category"
                    value=""
                    checked={selectedCategory === ""}
                    onChange={() => setSelectedCategory("")}
                    className="accent-purple-500"
                  />
                  <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                    All Categories
                  </span>
                </label>
                {categories.map((cat) => (
                  <label key={cat._id} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="category"
                      value={cat.slug}
                      checked={selectedCategory === cat.slug}
                      onChange={() => setSelectedCategory(cat.slug)}
                      className="accent-purple-500"
                    />
                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                      {cat.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price range */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
                Price Range
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="input-field text-sm py-2"
                  min="0"
                />
                <span className="text-gray-600">—</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="input-field text-sm py-2"
                  min="0"
                />
              </div>
            </div>

            {/* In Stock */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
                Availability
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <div
                  onClick={() => setInStock(!inStock)}
                  className={cn(
                    "relative w-10 h-5 rounded-full transition-colors duration-200 cursor-pointer",
                    inStock ? "bg-purple-600" : "bg-gray-700"
                  )}
                >
                  <div
                    className={cn(
                      "absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200",
                      inStock ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </div>
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                  In stock only
                </span>
              </label>
            </div>

            {/* Clear */}
            <div className="flex items-end">
              {hasFilters && (
                <button
                  onClick={clearAll}
                  className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Clear all filters
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
