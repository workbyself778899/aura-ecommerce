"use client";

import { useState, useEffect } from "react";
import { getCategories, createCategory, deleteCategory } from "@/actions/categories";
import type { ICategory } from "@/types";
import { Plus, Trash2, Tags, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCats = async () => {
    setIsLoading(true);
    const data = await getCategories();
    setCategories(data);
    setIsLoading(false);
  };

  // Fetch categories on mount — safe data-fetching pattern
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    fetchCats();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    const toastId = toast.loading("Creating category...");

    const res = await createCategory({ name, description });
    if (res.success) {
      toast.success("Category created!", { id: toastId });
      setName("");
      setDescription("");
      fetchCats();
    } else {
      toast.error(res.error ?? "Failed to create category", { id: toastId });
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    const toastId = toast.loading("Deleting category...");
    const res = await deleteCategory(id);
    if (res.success) {
      toast.success("Category deleted", { id: toastId });
      fetchCats();
    } else {
      toast.error(res.error ?? "Failed", { id: toastId });
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Categories</h1>
        <p className="text-sm text-gray-400 mt-1">Organize your store products</p>
      </div>

      {/* Create form */}
      <div className="glass rounded-2xl p-6 border border-[var(--border-subtle)] space-y-4">
        <h2 className="text-lg font-semibold text-white">Add New Category</h2>

        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Category Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Headphones"
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                className="input-field"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className="btn-primary py-2.5 px-5 text-sm"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Create Category
              </>
            )}
          </button>
        </form>
      </div>

      {/* Category list */}
      <div className="glass rounded-2xl overflow-hidden border border-[var(--border-subtle)]">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading categories...</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5 text-xs text-gray-500 uppercase">
                <th className="px-5 py-4 text-left">Name</th>
                <th className="px-5 py-4 text-left">Slug</th>
                <th className="px-5 py-4 text-left">Description</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {categories.map((cat) => (
                <tr key={cat._id} className="hover:bg-white/2">
                  <td className="px-5 py-4 font-semibold text-white">{cat.name}</td>
                  <td className="px-5 py-4 text-purple-400 font-mono text-xs">{cat.slug}</td>
                  <td className="px-5 py-4 text-gray-400">{cat.description || "—"}</td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => handleDelete(cat._id)}
                      className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"
                      title="Delete category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!isLoading && categories.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Tags className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No categories created yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
