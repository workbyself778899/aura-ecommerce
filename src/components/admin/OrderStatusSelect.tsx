"use client";

import { useState } from "react";
import { updateOrderStatus } from "@/actions/orders";
import type { OrderStatus } from "@/types";
import toast from "react-hot-toast";

interface OrderStatusSelectProps {
  orderId: string;
  currentStatus: OrderStatus;
}

const statusColors: Record<OrderStatus, string> = {
  PENDING: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  PROCESSING: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  SHIPPED: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  DELIVERED: "bg-green-500/15 text-green-400 border-green-500/30",
  CANCELLED: "bg-red-500/15 text-red-400 border-red-500/30",
};

export default function OrderStatusSelect({
  orderId,
  currentStatus,
}: OrderStatusSelectProps) {
  const [status, setStatus] = useState<OrderStatus>(currentStatus);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleChange = async (newStatus: OrderStatus) => {
    setIsUpdating(true);
    const toastId = toast.loading(`Updating order status to ${newStatus}...`);

    try {
      const res = await updateOrderStatus(orderId, newStatus);
      if (res.success) {
        setStatus(newStatus);
        toast.success(`Order updated to ${newStatus}`, { id: toastId });
      } else {
        toast.error(res.error ?? "Update failed", { id: toastId });
      }
    } catch {
      toast.error("An error occurred", { id: toastId });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <select
      value={status}
      disabled={isUpdating}
      onChange={(e) => handleChange(e.target.value as OrderStatus)}
      className={`px-3 py-1 rounded-full text-xs font-semibold border cursor-pointer outline-none transition-all ${statusColors[status]}`}
    >
      <option value="PENDING" className="bg-[#12121a] text-amber-400">PENDING</option>
      <option value="PROCESSING" className="bg-[#12121a] text-blue-400">PROCESSING</option>
      <option value="SHIPPED" className="bg-[#12121a] text-purple-400">SHIPPED</option>
      <option value="DELIVERED" className="bg-[#12121a] text-green-400">DELIVERED</option>
      <option value="CANCELLED" className="bg-[#12121a] text-red-400">CANCELLED</option>
    </select>
  );
}
