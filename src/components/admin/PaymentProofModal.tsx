"use client";

import { useState } from "react";
import Image from "next/image";
import {
  FileText,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Eye,
  Loader2,
  X,
  ShieldAlert,
  Download,
} from "lucide-react";
import { approveOrderPayment, rejectOrderPayment } from "@/actions/payments";
import toast from "react-hot-toast";
import type { IOrder } from "@/types";
import { formatPrice } from "@/lib/utils";

interface PaymentProofModalProps {
  order: IOrder;
}

export default function PaymentProofModal({ order }: PaymentProofModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const proof = order.paymentProof;
  if (!proof?.fileUrl) return null;

  const isPdf =
    proof.fileType?.includes("pdf") ||
    proof.fileUrl.toLowerCase().endsWith(".pdf") ||
    proof.fileName?.toLowerCase().endsWith(".pdf");

  const handleApprove = async () => {
    if (!confirm(`Are you sure you want to approve payment for Order ${order.orderNumber}?`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await approveOrderPayment(order._id);
      if (res.success) {
        toast.success(`Order ${order.orderNumber} payment approved!`);
        setIsOpen(false);
      } else {
        toast.error(res.error || "Approval failed");
      }
    } catch (err) {
      toast.error("Failed to approve payment");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    const reason = prompt("Enter rejection reason (optional):");
    if (reason === null) return; // user cancelled prompt

    setLoading(true);
    try {
      const res = await rejectOrderPayment(order._id, reason);
      if (res.success) {
        toast.success(`Payment marked as unpaid.`);
        setIsOpen(false);
      } else {
        toast.error(res.error || "Rejection failed");
      }
    } catch (err) {
      toast.error("Failed to reject payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20 hover:bg-purple-500/20 transition-colors"
      >
        <Eye className="w-3.5 h-3.5" />
        <span>Proof</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div
            className="glass rounded-3xl max-w-2xl w-full border border-white/10 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Payment Proof: Order #{order.orderNumber}</span>
                  <span
                    className={`badge text-[11px] ${
                      order.paymentStatus === "PAID"
                        ? "bg-green-500/15 text-green-400"
                        : order.paymentStatus === "UNDER_REVIEW"
                        ? "bg-amber-500/15 text-amber-400"
                        : "bg-red-500/15 text-red-400"
                    }`}
                  >
                    {order.paymentStatus}
                  </span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Amount:{" "}
                  <span className="text-white font-semibold">
                    {formatPrice(order.totalAmount)}
                  </span>{" "}
                  • Method: {order.paymentMethod}
                </p>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Customer Notes / Txn Ref */}
              {proof.notes && (
                <div className="p-3 bg-purple-950/30 rounded-xl border border-purple-500/20 text-xs">
                  <span className="text-purple-300 font-semibold block mb-0.5">
                    Customer Transaction Ref / Notes:
                  </span>
                  <p className="text-white font-mono">{proof.notes}</p>
                </div>
              )}

              {/* Receipt Display */}
              <div className="rounded-2xl border border-white/10 bg-black/40 p-3 flex flex-col items-center justify-center min-h-[300px]">
                {isPdf ? (
                  <div className="text-center p-8 space-y-3">
                    <div className="w-16 h-16 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto border border-red-500/30">
                      <FileText className="w-8 h-8" />
                    </div>
                    <p className="text-sm font-semibold text-white">
                      {proof.fileName || "Payment Receipt PDF"}
                    </p>
                    <div className="flex gap-3 justify-center pt-2">
                      <a
                        href={proof.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-primary py-2 px-4 text-xs inline-flex items-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open PDF in New Tab</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 w-full flex flex-col items-center">
                    <div className="relative w-full max-w-lg h-96 rounded-xl overflow-hidden border border-white/10 bg-black">
                      <Image
                        src={proof.fileUrl}
                        alt="Payment Receipt"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <a
                        href={proof.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open original image full size</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer / Actions */}
            <div className="p-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 bg-white/2">
              <span className="text-xs text-gray-400">
                Uploaded: {new Date(proof.uploadedAt).toLocaleString()}
              </span>

              <div className="flex items-center gap-2">
                {order.paymentStatus !== "PAID" && (
                  <>
                    <button
                      onClick={handleReject}
                      disabled={loading}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                    <button
                      onClick={handleApprove}
                      disabled={loading}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-green-600 text-white hover:bg-green-500 transition-colors flex items-center gap-1.5 shadow-lg shadow-green-600/20"
                    >
                      {loading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      <span>Approve Payment</span>
                    </button>
                  </>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
