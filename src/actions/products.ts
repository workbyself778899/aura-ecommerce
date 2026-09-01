"use server";

import { revalidatePath } from "next/cache";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import { deleteFile, bulkDeleteFiles } from "@/lib/imagekit";
import { auth } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import type { ImageObject, ProductFilters, IProduct } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Authorization helper
// ─────────────────────────────────────────────────────────────────────────────
async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized: Admin access required");
  }
  return session;
}

// ─────────────────────────────────────────────────────────────────────────────
// READ: Get paginated products with filters
// ─────────────────────────────────────────────────────────────────────────────
export async function getProducts(filters: ProductFilters = {}): Promise<{
  products: IProduct[];
  total: number;
  pages: number;
}> {
  await connectDB();

  const {
    search,
    category,
    minPrice,
    maxPrice,
    inStock,
    sort = "newest",
    page = 1,
    limit = 12,
  } = filters;

  // Build query
  const query: Record<string, unknown> = { isPublished: true };

  if (search) {
    query.$text = { $search: search } as unknown;
  }
  if (category) {
    // Try to find category by slug first
    const Category = (await import("@/models/Category")).default;
    const cat = await Category.findOne({ slug: category }).lean();
    if (cat) query.categoryId = (cat as { _id: unknown })._id;
  }
  if (minPrice !== undefined || maxPrice !== undefined) {
    const priceFilter: Record<string, number> = {};
    if (minPrice !== undefined) priceFilter.$gte = minPrice;
    if (maxPrice !== undefined) priceFilter.$lte = maxPrice;
    query.price = priceFilter as unknown;
  }
  if (inStock) {
    query.stockQuantity = { $gt: 0 };
  }

  type SortValue = Record<string, 1 | -1>;
  const sortMap: Record<string, SortValue> = {
    newest: { createdAt: -1 },
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    rating: { avgRating: -1 },
  };
  const sortObj: SortValue = sortMap[sort] ?? { createdAt: -1 };

  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    Product.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .populate("categoryId", "name slug")
      .lean(),
    Product.countDocuments(query),
  ]);

  return {
    products: products.map((p) => serializeProduct(p as unknown as LeanProduct)) as IProduct[],
    total,
    pages: Math.ceil(total / limit),
  };

}

// ─────────────────────────────────────────────────────────────────────────────
// READ: Get single product by slug
// ─────────────────────────────────────────────────────────────────────────────
export async function getProductBySlug(slug: string): Promise<IProduct | null> {
  await connectDB();

  const product = await Product.findOne({ slug, isPublished: true })
    .populate("categoryId", "name slug")
    .lean();

  if (!product) return null;
  return serializeProduct(product as unknown as LeanProduct) as IProduct;
}

// ─────────────────────────────────────────────────────────────────────────────
// READ: Get featured products
// ─────────────────────────────────────────────────────────────────────────────
export async function getFeaturedProducts(limit = 8): Promise<IProduct[]> {
  await connectDB();

  const products = await Product.find({ isPublished: true, isFeatured: true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("categoryId", "name slug")
    .lean();

  return products.map((p) => serializeProduct(p as unknown as LeanProduct)) as IProduct[];
}

// ─────────────────────────────────────────────────────────────────────────────
// READ: Admin — all products
// ─────────────────────────────────────────────────────────────────────────────
export async function getAdminProducts(page = 1, limit = 20): Promise<{
  products: IProduct[];
  total: number;
  pages: number;
}> {
  await requireAdmin();
  await connectDB();

  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    Product.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("categoryId", "name slug")
      .lean(),
    Product.countDocuments(),
  ]);

  return {
    products: products.map((p) => serializeProduct(p as unknown as LeanProduct)) as IProduct[],
    total,
    pages: Math.ceil(total / limit),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// READ: Get product by ID (admin)
// ─────────────────────────────────────────────────────────────────────────────
export async function getProductById(id: string): Promise<IProduct | null> {
  await requireAdmin();
  await connectDB();

  const product = await Product.findById(id)
    .populate("categoryId", "name slug")
    .lean();

  if (!product) return null;
  return serializeProduct(product as unknown as LeanProduct) as IProduct;
}


// ─────────────────────────────────────────────────────────────────────────────
// CREATE: New product
// ─────────────────────────────────────────────────────────────────────────────
export async function createProduct(data: {
  title: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  sku: string;
  stockQuantity: number;
  categoryId: string;
  images: ImageObject[];
  variants?: Array<{
    sku: string;
    name: string;
    price: number;
    stockQuantity: number;
    attributes: Record<string, string>;
  }>;
  isPublished?: boolean;
  isFeatured?: boolean;
}): Promise<{ success: boolean; productId?: string; error?: string }> {
  await requireAdmin();
  await connectDB();

  try {
    const slug = slugify(data.title);

    // Make first image the cover if not set
    const images = data.images.map((img, i) => ({
      ...img,
      isCover: i === 0 ? true : img.isCover,
    }));

    const product = await Product.create({
      ...data,
      slug,
      images,
    });

    revalidatePath("/admin/products");
    revalidatePath("/products");
    revalidatePath("/");

    return { success: true, productId: product._id.toString() };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to create product";
    return { success: false, error: msg };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE: Product
// ─────────────────────────────────────────────────────────────────────────────
export async function updateProduct(
  id: string,
  data: Partial<{
    title: string;
    description: string;
    price: number;
    compareAtPrice: number;
    sku: string;
    stockQuantity: number;
    categoryId: string;
    isPublished: boolean;
    isFeatured: boolean;
    variants: Array<{
      sku: string;
      name: string;
      price: number;
      stockQuantity: number;
      attributes: Record<string, string>;
    }>;
  }>
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  await connectDB();

  try {
    const updateData = { ...data } as Record<string, unknown>;
    if (data.title) {
      updateData.slug = slugify(data.title);
    }

    await Product.findByIdAndUpdate(id, { $set: updateData }, { new: true });

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${id}/edit`);
    revalidatePath("/products");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Update failed",
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE: Single image from product (with ImageKit cascade delete)
// ─────────────────────────────────────────────────────────────────────────────
export async function deleteProductImage(
  productId: string,
  fileId: string
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  await connectDB();

  try {
    // 1. Remove from ImageKit
    await deleteFile(fileId);

    // 2. Remove from MongoDB using $pull
    const result = await Product.findByIdAndUpdate(
      productId,
      { $pull: { images: { fileId } } },
      { new: true }
    );

    if (!result) {
      return { success: false, error: "Product not found" };
    }

    // 3. If the deleted image was the cover, promote the next image
    const hasNoCover = result.images.every((img) => !img.isCover);
    if (hasNoCover && result.images.length > 0) {
      await Product.findByIdAndUpdate(productId, {
        $set: { "images.0.isCover": true },
      });
    }

    revalidatePath(`/admin/products/${productId}/edit`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Delete image failed",
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ADD: Image to existing product
// ─────────────────────────────────────────────────────────────────────────────
export async function addProductImage(
  productId: string,
  image: ImageObject
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  await connectDB();

  try {
    const product = await Product.findById(productId);
    if (!product) return { success: false, error: "Product not found" };

    // First image auto-cover
    const isCover = product.images.length === 0;

    await Product.findByIdAndUpdate(productId, {
      $push: { images: { ...image, isCover } },
    });

    revalidatePath(`/admin/products/${productId}/edit`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Add image failed",
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SET: Cover image
// ─────────────────────────────────────────────────────────────────────────────
export async function setCoverImage(
  productId: string,
  fileId: string
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  await connectDB();

  try {
    const product = await Product.findById(productId);
    if (!product) return { success: false, error: "Product not found" };

    // Reset all, then set the chosen one
    const updatedImages = product.images.map((img) => ({
      ...img,
      isCover: img.fileId === fileId,
    }));


    await Product.findByIdAndUpdate(productId, {
      $set: { images: updatedImages },
    });

    revalidatePath(`/admin/products/${productId}/edit`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Set cover failed",
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE: Full product with ImageKit cascade delete
// ─────────────────────────────────────────────────────────────────────────────
export async function deleteProduct(
  id: string
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  await connectDB();

  try {
    // 1. Fetch the product to get all ImageKit fileIds
    const product = await Product.findById(id);
    if (!product) return { success: false, error: "Product not found" };

    // 2. Bulk delete all images from ImageKit
    const fileIds = product.images
      .map((img) => img.fileId)
      .filter(Boolean) as string[];

    if (fileIds.length > 0) {
      await bulkDeleteFiles(fileIds);
    }

    // 3. Delete the product document
    await Product.findByIdAndDelete(id);

    revalidatePath("/admin/products");
    revalidatePath("/products");
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Delete failed",
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper types
// ─────────────────────────────────────────────────────────────────────────────
type LeanProduct = Record<string, unknown>;

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Serialize Mongoose lean document to plain IProduct
// ─────────────────────────────────────────────────────────────────────────────
function serializeProduct(doc: LeanProduct): IProduct {
  return {
    ...doc,
    _id: String(doc._id),
    categoryId: String(doc.categoryId),
    category: doc.categoryId && typeof doc.categoryId === "object"
      ? {
          _id: String((doc.categoryId as Record<string, unknown>)._id),
          name: String((doc.categoryId as Record<string, unknown>).name ?? ""),
          slug: String((doc.categoryId as Record<string, unknown>).slug ?? ""),
          createdAt: "",
          updatedAt: "",
        }
      : undefined,
    createdAt: doc.createdAt instanceof Date
      ? doc.createdAt.toISOString()
      : String(doc.createdAt ?? ""),
    updatedAt: doc.updatedAt instanceof Date
      ? doc.updatedAt.toISOString()
      : String(doc.updatedAt ?? ""),
  } as IProduct;
}
