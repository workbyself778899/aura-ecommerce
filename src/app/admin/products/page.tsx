import Link from "next/link";
import { getAdminProducts } from "@/actions/products";
import { formatPrice } from "@/lib/utils";
import { Plus, Edit, Eye, Package } from "lucide-react";
import Image from "next/image";
import DeleteProductButton from "@/components/admin/DeleteProductButton";

interface AdminProductsPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function AdminProductsPage({
  searchParams,
}: AdminProductsPageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const { products, total, pages } = await getAdminProducts(page, 20);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Products</h1>
          <p className="text-sm text-gray-400 mt-1">{total} total products</p>
        </div>
        <Link href="/admin/products/new" className="btn-primary">
          <Plus className="w-4 h-4" />
          Add Product
        </Link>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden border border-[var(--border-subtle)]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {["Product", "Category", "Price", "Stock", "Status", "Actions"].map(
                  (col) => (
                    <th
                      key={col}
                      className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      {col}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {products.map((product) => {
                const cover =
                  product.images.find((i) => i.isCover)?.url ??
                  product.images[0]?.url;

                return (
                  <tr
                    key={product._id}
                    className="hover:bg-white/2 transition-colors"
                  >
                    {/* Product */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
                          {cover ? (
                            <Image src={cover} alt={product.title} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-5 h-5 text-gray-600" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white line-clamp-1">
                            {product.title}
                          </p>
                          <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-5 py-4">
                      <span className="text-sm text-gray-400">
                        {product.category?.name ?? "—"}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="px-5 py-4">
                      <span className="text-sm font-medium text-white">
                        {formatPrice(product.price)}
                      </span>
                    </td>

                    {/* Stock */}
                    <td className="px-5 py-4">
                      <span
                        className={`text-sm font-medium ${
                          product.stockQuantity === 0
                            ? "text-red-400"
                            : product.stockQuantity <= 10
                            ? "text-amber-400"
                            : "text-green-400"
                        }`}
                      >
                        {product.stockQuantity}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <span
                        className={`badge ${
                          product.isPublished
                            ? "bg-green-500/15 text-green-400"
                            : "bg-gray-700/50 text-gray-400"
                        }`}
                      >
                        {product.isPublished ? "Published" : "Draft"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/products/${product.slug}`}
                          target="_blank"
                          className="p-1.5 text-gray-500 hover:text-blue-400 transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/admin/products/${product._id}/edit`}
                          className="p-1.5 text-gray-500 hover:text-purple-400 transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <DeleteProductButton productId={product._id} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {products.length === 0 && (
            <div className="text-center py-16 text-gray-500">
              <Package className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No products yet</p>
              <Link href="/admin/products/new" className="btn-primary mt-4 inline-flex text-sm">
                Add your first product
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/products?page=${p}`}
              className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-medium transition-all ${
                p === page
                  ? "bg-gradient-to-br from-purple-600 to-amber-500 text-white"
                  : "glass text-gray-400 hover:text-white"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
