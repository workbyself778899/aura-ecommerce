"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteProduct } from "@/actions/products";
import { Trash2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface DeleteProductButtonProps {
  productId: string;
}

export default function DeleteProductButton({ productId }: DeleteProductButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this product? All images will be permanently purged from ImageKit.")) {
      return;
    }

    setIsDeleting(true);
    const toastId = toast.loading("Deleting product and purging ImageKit assets...");

    try {
      const result = await deleteProduct(productId);
      if (result.success) {
        toast.success("Product and assets deleted successfully", { id: toastId });
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to delete product", { id: toastId });
      }
    } catch (_) {
      toast.error("An unexpected error occurred", { id: toastId });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="p-1.5 text-gray-500 hover:text-red-400 transition-colors disabled:opacity-50"
      title="Delete Product (Cascade Purge)"
    >
      {isDeleting ? <Loader2 className="w-4 h-4 animate-spin text-red-400" /> : <Trash2 className="w-4 h-4" />}
    </button>
  );
}
