import mongoose, { Schema, Document, Model } from "mongoose";

const ImageObjectSchema = new Schema(
  {
    fileId: { type: String, required: true },
    url: { type: String, required: true },
    thumbnailUrl: { type: String },
    filePath: { type: String, required: true },
    name: { type: String, required: true },
    isCover: { type: Boolean, default: false },
  },
  { _id: false }
);

const ProductVariantSchema = new Schema(
  {
    sku: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    stockQuantity: { type: Number, required: true, min: 0, default: 0 },
    attributes: { type: Map, of: String, default: {} },
  },
  { _id: true }
);

export interface IProductDocument extends Document {
  title: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  sku: string;
  stockQuantity: number;
  categoryId: mongoose.Types.ObjectId;
  images: Array<{
    fileId: string;
    url: string;
    thumbnailUrl?: string;
    filePath: string;
    name: string;
    isCover: boolean;
  }>;
  variants: Array<{
    _id: mongoose.Types.ObjectId;
    sku: string;
    name: string;
    price: number;
    stockQuantity: number;
    attributes: Map<string, string>;
  }>;
  isPublished: boolean;
  isFeatured: boolean;
  avgRating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProductDocument>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    sku: { type: String, required: true, unique: true, uppercase: true },
    stockQuantity: { type: Number, required: true, min: 0, default: 0 },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    images: { type: [ImageObjectSchema], default: [] },
    variants: { type: [ProductVariantSchema], default: [] },
    isPublished: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    avgRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

// Indexes for search performance
ProductSchema.index({ slug: 1 });
ProductSchema.index({ categoryId: 1 });
ProductSchema.index({ isPublished: 1, isFeatured: 1 });
ProductSchema.index({ title: "text", description: "text" });

const Product: Model<IProductDocument> =
  mongoose.models.Product ||
  mongoose.model<IProductDocument>("Product", ProductSchema);

export default Product;
