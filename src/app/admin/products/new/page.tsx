import ProductForm from "@/components/admin/ProductForm";
import { getCategories } from "@/actions/categories";

export default async function NewProductPage() {
  const categories = await getCategories();

  return <ProductForm categories={categories} />;
}
