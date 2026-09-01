"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createProduct, updateProduct } from "@/actions/products";
import ImageKitUploader from "@/components/admin/ImageKitUploader";
import type { ICategory, IProduct, ImageObject } from "@/types";
import { Plus, Trash2, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

const productSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.coerce.number().min(0.01, "Price must be greater than 0"),
  compareAtPrice: z.coerce.number().optional(),
  sku: z.string().min(3, "SKU is required"),
  stockQuantity: z.coerce.number().min(0, "Stock cannot be negative"),
  categoryId: z.string().min(1, "Please select a category"),
  isPublished: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  variants: z
    .array(
      z.object({
        sku: z.string().min(1, "SKU required"),
        name: z.string().min(1, "Variant name required"),
        price: z.coerce.number().min(0),
        stockQuantity: z.coerce.number().min(0),
      })
    )
    .default([]),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  initialData?: IProduct;
  categories: ICategory[];
}

export default function ProductForm({ initialData, categories }: ProductFormProps) {
  const router = useRouter();
  const isEditing = Boolean(initialData);
  const [images, setImages] = useState<ImageObject[]>(initialData?.images || []);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    // Zod v4 coerce types are slightly incompatible with react-hook-form's resolver generic
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      price: initialData?.price || 0,
      compareAtPrice: initialData?.compareAtPrice || undefined,
      sku: initialData?.sku || "",
      stockQuantity: initialData?.stockQuantity || 0,
      categoryId: initialData?.categoryId || (categories[0]?._id ?? ""),
      isPublished: initialData?.isPublished ?? true,
      isFeatured: initialData?.isFeatured ?? false,
      variants: initialData?.variants?.map((v) => ({
        sku: v.sku,
        name: v.name,
        price: v.price,
        stockQuantity: v.stockQuantity,
      })) || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants",
  });

  const selectedCategoryId = watch("categoryId");
  const selectedCategoryObj = categories.find((c) => c._id === selectedCategoryId);
  const categorySlug = selectedCategoryObj?.slug || "general";

  const onSubmit = async (data: ProductFormData) => {
    if (images.length === 0) {
      toast.error("Please upload at least one product image");
      return;
    }

    const toastId = toast.loading(isEditing ? "Updating product..." : "Creating product...");

    try {
      if (isEditing && initialData) {
        const result = await updateProduct(initialData._id, {
          ...data,
          variants: data.variants.map((v) => ({ ...v, attributes: {} })),
        });
        if (result.success) {
          toast.success("Product updated successfully", { id: toastId });
          router.push("/admin/products");
          router.refresh();
        } else {
          toast.error(result.error ?? "Failed to update product", { id: toastId });
        }
      } else {
        const result = await createProduct({
          ...data,
          images,
          variants: data.variants.map((v) => ({ ...v, attributes: {} })),
        });
        if (result.success) {
          toast.success("Product created successfully", { id: toastId });
          router.push("/admin/products");
          router.refresh();
        } else {
          toast.error(result.error ?? "Failed to create product", { id: toastId });
        }
      }
    } catch (_) {
      toast.error("An unexpected error occurred", { id: toastId });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-5xl">
      {/* Back button & title */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/products"
          className="p-2 rounded-xl glass hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">
            {isEditing ? `Edit "${initialData?.title}"` : "Create New Product"}
          </h1>
          <p className="text-sm text-gray-400">
            Fill in details and sync images directly with ImageKit.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Details (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Card */}
          <div className="glass rounded-2xl p-6 border border-[var(--border-subtle)] space-y-4">
            <h2 className="text-lg font-semibold text-white mb-4">Basic Information</h2>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Title</label>
              <input
                type="text"
                {...register("title")}
                placeholder="e.g. Wireless Noise-Canceling Headphones"
                className="input-field"
              />
              {errors.title && <p className="mt-1 text-xs text-red-400">{errors.title.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
              <textarea
                rows={5}
                {...register("description")}
                placeholder="Provide a detailed description of the product..."
                className="input-field resize-none"
              />
              {errors.description && (
                <p className="mt-1 text-xs text-red-400">{errors.description.message}</p>
              )}
            </div>
          </div>

          {/* Pricing & Inventory */}
          <div className="glass rounded-2xl p-6 border border-[var(--border-subtle)] space-y-4">
            <h2 className="text-lg font-semibold text-white mb-4">Pricing & Inventory</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register("price")}
                  placeholder="99.99"
                  className="input-field"
                />
                {errors.price && (
                  <p className="mt-1 text-xs text-red-400">{errors.price.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Compare At Price ($) <span className="text-xs text-gray-500">(Optional)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register("compareAtPrice")}
                  placeholder="129.99"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">SKU</label>
                <input
                  type="text"
                  {...register("sku")}
                  placeholder="PROD-HEAD-001"
                  className="input-field uppercase"
                />
                {errors.sku && <p className="mt-1 text-xs text-red-400">{errors.sku.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Stock Quantity
                </label>
                <input
                  type="number"
                  {...register("stockQuantity")}
                  placeholder="50"
                  className="input-field"
                />
                {errors.stockQuantity && (
                  <p className="mt-1 text-xs text-red-400">{errors.stockQuantity.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Media Manager (ImageKit) */}
          <div className="glass rounded-2xl p-6 border border-[var(--border-subtle)] space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Media Manager (ImageKit)</h2>
              <p className="text-xs text-gray-400 mt-1">
                Uploads route to <code className="text-purple-400">/products/{categorySlug}/</code>. First image is auto-set as Cover.
              </p>
            </div>

            <ImageKitUploader
              productId={initialData?._id}
              category={categorySlug}
              images={images}
              onChange={setImages}
            />
          </div>

          {/* Variants */}
          <div className="glass rounded-2xl p-6 border border-[var(--border-subtle)] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Product Variants</h2>
                <p className="text-xs text-gray-400">Options like Size, Color, or Spec</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  append({ sku: "", name: "", price: 0, stockQuantity: 0 })
                }
                className="btn-primary py-1.5 px-3 text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Variant
              </button>
            </div>

            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-12 gap-3 items-center p-3 bg-black/20 rounded-xl">
                <div className="col-span-4">
                  <input
                    placeholder="Variant Name (e.g. Size L - Black)"
                    {...register(`variants.${index}.name`)}
                    className="input-field py-1.5 text-xs"
                  />
                </div>
                <div className="col-span-3">
                  <input
                    placeholder="Variant SKU"
                    {...register(`variants.${index}.sku`)}
                    className="input-field py-1.5 text-xs uppercase"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Price"
                    {...register(`variants.${index}.price`)}
                    className="input-field py-1.5 text-xs"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    placeholder="Stock"
                    {...register(`variants.${index}.stockQuantity`)}
                    className="input-field py-1.5 text-xs"
                  />
                </div>
                <div className="col-span-1 text-right">
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-gray-500 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Controls (1 Col) */}
        <div className="space-y-6">
          <div className="glass rounded-2xl p-6 border border-[var(--border-subtle)] space-y-4">
            <h2 className="text-lg font-semibold text-white mb-4">Organization & Status</h2>

            {/* Category selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Category</label>
              <select {...register("categoryId")} className="input-field cursor-pointer">
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="mt-1 text-xs text-red-400">{errors.categoryId.message}</p>
              )}
            </div>

            {/* Publish Toggle */}
            <div className="pt-2 border-t border-white/5 space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm font-medium text-gray-300">Published Status</span>
                <input
                  type="checkbox"
                  {...register("isPublished")}
                  className="w-4 h-4 accent-purple-500 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm font-medium text-gray-300">Featured Product</span>
                <input
                  type="checkbox"
                  {...register("isFeatured")}
                  className="w-4 h-4 accent-purple-500 rounded cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Submit card */}
          <div className="glass rounded-2xl p-6 border border-[var(--border-subtle)] space-y-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-3 text-base"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isEditing ? (
                "Save Changes"
              ) : (
                "Create Product"
              )}
            </button>
            <Link
              href="/admin/products"
              className="block text-center text-sm text-gray-400 hover:text-gray-200 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </form>
  );
}
