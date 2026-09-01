import { getDashboardStats } from "@/actions/orders";
import {
  DollarSign,
  ShoppingCart,
  Users,
  Clock,
  TrendingUp,
  Package,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import RevenueChart from "@/components/admin/RevenueChart";

export default async function AdminDashboard() {
  const stats = await getDashboardStats();

  const statCards = [
    {
      label: "Total Revenue",
      value: formatPrice(stats.totalRevenue),
      icon: DollarSign,
      color: "from-purple-600 to-purple-800",
      trend: "+12%",
    },
    {
      label: "Total Orders",
      value: String(stats.totalOrders),
      icon: ShoppingCart,
      color: "from-blue-600 to-blue-800",
      trend: "+8%",
    },
    {
      label: "Customers",
      value: String(stats.totalCustomers),
      icon: Users,
      color: "from-green-600 to-green-800",
      trend: "+23%",
    },
    {
      label: "Pending Orders",
      value: String(stats.pendingOrders),
      icon: Clock,
      color: "from-amber-600 to-amber-800",
      trend: null,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">
          Welcome back! Here&apos;s what&apos;s happening in your store.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, trend }) => (
          <div key={label} className="glass rounded-2xl p-5 border border-[var(--border-subtle)]">
            <div className="flex items-center justify-between mb-4">
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}
              >
                <Icon className="w-5 h-5 text-white" />
              </div>
              {trend && (
                <span className="text-xs text-green-400 font-medium flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {trend}
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-sm text-gray-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="glass rounded-2xl p-6 border border-[var(--border-subtle)]">
        <h2 className="text-lg font-semibold text-white mb-6">Revenue (Last 30 Days)</h2>
        <RevenueChart data={stats.revenueByDay} />
      </div>

      {/* Top products */}
      {stats.topProducts.length > 0 && (
        <div className="glass rounded-2xl p-6 border border-[var(--border-subtle)]">
          <h2 className="text-lg font-semibold text-white mb-6">Top Selling Products</h2>
          <div className="space-y-3">
            {stats.topProducts.map((product, i) => (
              <div key={product.name} className="flex items-center gap-4">
                <div className="w-7 h-7 rounded-full bg-purple-900/50 flex items-center justify-center text-xs font-bold text-purple-400">
                  {i + 1}
                </div>
                <Package className="w-4 h-4 text-gray-600" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{product.name}</p>
                  <p className="text-xs text-gray-500">{product.sold} units sold</p>
                </div>
                <p className="text-sm font-semibold gradient-text">
                  {formatPrice(product.revenue)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
