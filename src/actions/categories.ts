"use server";

import { revalidatePath } from "next/cache";
import connectDB from "@/lib/mongodb";
import Category from "@/models/Category";
import { auth } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import type { ICategory } from "@/types";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
}

export async function getCategories(): Promise<ICategory[]> {
  await connectDB();
  const cats = await Category.find().sort({ name: 1 }).lean();
  return cats.map((c) => ({
    ...c,
    _id: String(c._id),
    createdAt: (c.createdAt as Date).toISOString(),
    updatedAt: (c.updatedAt as Date).toISOString(),
  })) as ICategory[];
}

export async function getCategoryBySlug(slug: string): Promise<ICategory | null> {
  await connectDB();
  const cat = await Category.findOne({ slug }).lean();
  if (!cat) return null;
  return {
    ...cat,
    _id: String(cat._id),
    createdAt: (cat.createdAt as Date).toISOString(),
    updatedAt: (cat.updatedAt as Date).toISOString(),
  } as ICategory;
}

export async function createCategory(data: {
  name: string;
  description?: string;
  imageId?: string;
  imageUrl?: string;
}): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  await connectDB();

  try {
    const slug = slugify(data.name);
    await Category.create({ ...data, slug });
    revalidatePath("/admin/categories");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed",
    };
  }
}

export async function updateCategory(
  id: string,
  data: Partial<{ name: string; description: string; imageId: string; imageUrl: string }>
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  await connectDB();

  try {
    const update: Record<string, unknown> = { ...data };
    if (data.name) update.slug = slugify(data.name);

    await Category.findByIdAndUpdate(id, { $set: update });
    revalidatePath("/admin/categories");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed" };
  }
}

export async function deleteCategory(id: string): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  await connectDB();

  try {
    await Category.findByIdAndDelete(id);
    revalidatePath("/admin/categories");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed" };
  }
}
