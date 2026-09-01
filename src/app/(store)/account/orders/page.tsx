import { getUserOrders } from "@/actions/orders";
import { formatPrice } from "@/lib/utils";
import { Package, Clock, CheckCircle, Truck, AlertCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

const statusIcons = {
  PENDING: Clock,
  PROCESSING: Clock,
  SHIPPED: Truck,
  DELIVERED: CheckCircle,
  CANCELLED: AlertCircle,
};

const statusColors = {
  PENDING: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  PROCESSING: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  SHIPPED: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  DELIVERED: "text-green-400 bg-green-500/10 border-green-500/20",
  CANCELLED: "text-red-400 bg-red-500/10 border-red-500/20",
};

export default async function UserOrdersPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/account/orders");
  }

  const orders = await getUserOrders();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div>
        <h1 className="section-title text-white">My Orders</h1>
        <p className="text-sm text-gray-400 mt-1">Track and manage your recent purchases</p>
      </div>

      {orders.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-purple-900/30 flex items-center justify-center mx-auto">
            <Package className="w-8 h-8 text-purple-400" />
          </div>
          <h2 className="text-xl font-semibold text-white">No orders placed yet</h2>
          <p className="text-sm text-gray-400">Start exploring our collection of premium products.</p>
          <Link href="/products" className="btn-primary inline-flex">
            Shop Now
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const Icon = statusIcons[order.status];

            return (
              <div
                key={order._id}
                className="glass rounded-2xl p-6 border border-[var(--border-subtle)] space-y-4"
              >
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
                  <div>
                    <span className="text-xs text-gray-500 uppercase font-medium">Order Number</span>
                    <p className="text-base font-bold text-purple-400">{order.orderNumber}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 uppercase font-medium">Date Placed</span>
                    <p className="text-sm text-gray-300">
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 uppercase font-medium">Total</span>
                    <p className="text-base font-bold text-white">
                      {formatPrice(order.totalAmount)}
                    </p>
                  </div>
                  <div>
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                        statusColors[order.status]
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      {item.imageUrl && (
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-800">
                          <Image src={item.imageUrl} alt={item.title} fill className="object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{item.title}</p>
                        {item.variantName && (
                          <p className="text-xs text-gray-500">{item.variantName}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-0.5">
                          Qty: {item.quantity} × {formatPrice(item.price)}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-white">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Tracking info */}
                {order.trackingNumber && (
                  <div className="pt-3 border-t border-white/5 flex items-center gap-2 text-xs text-purple-300">
                    <Truck className="w-4 h-4" />
                    Tracking Number: <span className="font-mono">{order.trackingNumber}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
