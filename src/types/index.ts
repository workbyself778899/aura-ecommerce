export type UserRole = "ADMIN" | "CUSTOMER";

export type OrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export type PaymentStatus = "UNPAID" | "PAID" | "REFUNDED";

export interface ImageObject {
  fileId: string;
  url: string;
  thumbnailUrl?: string;
  filePath: string;
  name: string;
  isCover: boolean;
}

export interface ProductVariant {
  sku: string;
  name: string;
  price: number;
  stockQuantity: number;
  attributes: Record<string, string>;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  variantName?: string;
  sku?: string;
}

// Serializable lean types (no Mongoose Document overhead)
export interface IUser {
  _id: string;
  email: string;
  name?: string;
  role: UserRole;
  image?: string;
  address?: Address;
  createdAt: string;
  updatedAt: string;
}

export interface ICategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  imageId?: string;
  imageUrl?: string;
  productCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface IProduct {
  _id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  sku: string;
  stockQuantity: number;
  categoryId: string;
  category?: ICategory;
  images: ImageObject[];
  variants: ProductVariant[];
  isPublished: boolean;
  isFeatured: boolean;
  avgRating?: number;
  reviewCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface IOrder {
  _id: string;
  orderNumber: string;
  user: string | IUser;
  status: OrderStatus;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  esewaTransactionId?: string;
  items: OrderItem[];
  shippingAddress: Address;
  trackingNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IReview {
  _id: string;
  product: string;
  user: string | IUser;
  rating: number;
  comment: string;
  verifiedPurchase: boolean;
  createdAt: string;
  updatedAt: string;
}

// Cart types (Zustand)
export interface CartItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  variantName?: string;
  sku?: string;
  slug: string;
}

// Filter / search types
export interface ProductFilters {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: "newest" | "price_asc" | "price_desc" | "rating";
  page?: number;
  limit?: number;
}
