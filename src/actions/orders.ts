"use server";

import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { IOrder, OrderStatus } from "@/types";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
}

type LeanOrder = Record<string, unknown> & {
  _id: unknown;
  user: unknown;
  createdAt: unknown;
  updatedAt: unknown;
};

function serializeOrder(doc: LeanOrder): IOrder {
  return {
    ...doc,
    _id: String(doc._id),
    user: typeof doc.user === "object" && doc.user !== null ? doc.user : String(doc.user),
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : String(doc.createdAt ?? ""),
    updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : String(doc.updatedAt ?? ""),
  } as IOrder;
}

export async function getUserOrders(): Promise<IOrder[]> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await connectDB();

  const orders = await Order.find({ user: session.user.id })
    .sort({ createdAt: -1 })
    .lean();

  return orders.map((o) => serializeOrder(o as unknown as LeanOrder));
}

export async function getOrderById(id: string): Promise<IOrder | null> {
  const session = await auth();
  if (!session?.user) return null;

  await connectDB();

  const order = await Order.findById(id).lean();
  if (!order) return null;

  // Customers can only see their own orders
  const orderUserId = String((order as unknown as LeanOrder).user);
  if (session.user.role !== "ADMIN" && orderUserId !== session.user.id) {
    return null;
  }

  return serializeOrder(order as unknown as LeanOrder);
}

export async function getAdminOrders(page = 1, limit = 20, status?: OrderStatus): Promise<{
  orders: IOrder[];
  total: number;
  pages: number;
}> {
  await requireAdmin();
  await connectDB();

  const query = status ? { status } : {};
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "name email")
      .lean(),
    Order.countDocuments(query),
  ]);

  return {
    orders: orders.map((o) => serializeOrder(o as unknown as LeanOrder)),
    total,
    pages: Math.ceil(total / limit),
  };
}


export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  trackingNumber?: string
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  await connectDB();

  try {
    const update: Record<string, unknown> = { status };
    if (trackingNumber) update.trackingNumber = trackingNumber;

    await Order.findByIdAndUpdate(id, { $set: update });

    revalidatePath("/admin/orders");
    revalidatePath(`/account/orders/${id}`);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Update failed",
    };
  }
}

export async function getDashboardStats(): Promise<{
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  pendingOrders: number;
  revenueByDay: Array<{ date: string; revenue: number }>;
  topProducts: Array<{ name: string; sold: number; revenue: number }>;
}> {
  await requireAdmin();
  await connectDB();

  const User = (await import("@/models/User")).default;

  const [
    revenueAgg,
    totalOrders,
    totalCustomers,
    pendingOrders,
    revenueByDay,
    topProducts,
  ] = await Promise.all([
    Order.aggregate([
      { $match: { paymentStatus: "PAID" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]),
    Order.countDocuments(),
    User.countDocuments({ role: "CUSTOMER" }),
    Order.countDocuments({ status: "PENDING" }),
    Order.aggregate([
      { $match: { paymentStatus: "PAID" } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          revenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 30 },
      { $project: { date: "$_id", revenue: 1, _id: 0 } },
    ]),
    Order.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          name: { $first: "$items.title" },
          sold: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        },
      },
      { $sort: { sold: -1 } },
      { $limit: 5 },
      { $project: { name: 1, sold: 1, revenue: 1, _id: 0 } },
    ]),
  ]);

  return {
    totalRevenue: revenueAgg[0]?.total ?? 0,
    totalOrders,
    totalCustomers,
    pendingOrders,
    revenueByDay,
    topProducts,
  };
}
