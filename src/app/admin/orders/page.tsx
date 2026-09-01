import { getAdminOrders } from "@/actions/orders";
import { formatPrice } from "@/lib/utils";
import OrderStatusSelect from "@/components/admin/OrderStatusSelect";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import type { OrderStatus } from "@/types";

interface AdminOrdersPageProps {
  searchParams: Promise<{ page?: string; status?: string }>;
}

export default async function AdminOrdersPage({
  searchParams,
}: AdminOrdersPageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const statusFilter = params.status as OrderStatus | undefined;

  const { orders, total, pages } = await getAdminOrders(page, 20, statusFilter);

  const statuses: Array<OrderStatus | "ALL"> = [
    "ALL",
    "PENDING",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Orders</h1>
          <p className="text-sm text-gray-400 mt-1">{total} total orders</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-white/5 pb-3 overflow-x-auto">
        {statuses.map((s) => {
          const isActive = s === "ALL" ? !statusFilter : statusFilter === s;
          const href = s === "ALL" ? "/admin/orders" : `/admin/orders?status=${s}`;
          return (
            <Link
              key={s}
              href={href}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {s}
            </Link>
          );
        })}
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden border border-[var(--border-subtle)]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {["Order #", "Customer", "Items", "Total", "Payment", "Status", "Date"].map(
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
              {orders.map((order) => {
                const userObj =
                  typeof order.user === "object"
                    ? order.user
                    : { name: "Guest", email: "N/A" };

                return (
                  <tr key={order._id} className="hover:bg-white/2 transition-colors">
                    <td className="px-5 py-4">
                      <span className="text-sm font-semibold text-purple-400">
                        {order.orderNumber}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-white">{userObj.name}</p>
                      <p className="text-xs text-gray-500">{userObj.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-gray-300">
                        {order.items.length} item{order.items.length > 1 ? "s" : ""}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-bold text-white">
                        {formatPrice(order.totalAmount)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`badge ${
                          order.paymentStatus === "PAID"
                            ? "bg-green-500/15 text-green-400"
                            : "bg-amber-500/15 text-amber-400"
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <OrderStatusSelect
                        orderId={order._id}
                        currentStatus={order.status}
                      />
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {orders.length === 0 && (
            <div className="text-center py-16 text-gray-500">
              <ShoppingCart className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No orders matching this criteria</p>
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
              href={`/admin/orders?page=${p}${statusFilter ? `&status=${statusFilter}` : ""}`}
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
