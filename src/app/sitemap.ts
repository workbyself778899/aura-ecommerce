import { MetadataRoute } from "next";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import Category from "@/models/Category";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  await connectDB();

  const [products, categories] = await Promise.all([
    Product.find({ isPublished: true }, "slug updatedAt").lean(),
    Category.find({}, "slug updatedAt").lean(),
  ]);

  const productUrls = products.map((p) => ({
    url: `${baseUrl}/products/${p.slug}`,
    lastModified: (p.updatedAt as Date) || new Date(),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  const categoryUrls = categories.map((c) => ({
    url: `${baseUrl}/products?category=${c.slug}`,
    lastModified: (c.updatedAt as Date) || new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const staticUrls = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
  ];

  return [...staticUrls, ...productUrls, ...categoryUrls];
}
