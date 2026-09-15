import mongoose, { Schema, Document, Model } from "mongoose";
import type { OrderStatus, PaymentStatus, PaymentMethod } from "@/types";

const AddressSchema = new Schema(
  {
    fullName: { type: String },
    phone: { type: String },
    line1: { type: String, required: true },
    line2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true, default: "NP" },
  },
  { _id: false }
);

const PaymentProofSchema = new Schema(
  {
    fileUrl: { type: String, required: true },
    fileName: { type: String, default: "" },
    fileType: { type: String, default: "" },
    notes: { type: String, default: "" },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const OrderItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    title: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    imageUrl: { type: String },
    variantName: { type: String },
    sku: { type: String },
  },
  { _id: false }
);

export interface IOrderDocument extends Document {
  orderNumber: string;
  user?: mongoose.Types.ObjectId;
  status: OrderStatus;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentProof?: {
    fileUrl: string;
    fileName: string;
    fileType: string;
    notes?: string;
    uploadedAt: Date;
  };
  customerNotes?: string;
  esewaTransactionId?: string;
  items: Array<{
    productId: mongoose.Types.ObjectId;
    title: string;
    price: number;
    quantity: number;
    imageUrl?: string;
    variantName?: string;
    sku?: string;
  }>;
  shippingAddress: {
    fullName?: string;
    phone?: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  trackingNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrderDocument>(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: false },
    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"],
      default: "PENDING",
    },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentStatus: {
      type: String,
      enum: ["UNPAID", "PAID", "UNDER_REVIEW", "REFUNDED"],
      default: "UNPAID",
    },
    paymentMethod: {
      type: String,
      enum: ["ESEWA", "QR_CODE", "CASH_ON_DELIVERY"],
      default: "ESEWA",
    },
    paymentProof: { type: PaymentProofSchema },
    customerNotes: { type: String },
    esewaTransactionId: { type: String },
    items: { type: [OrderItemSchema], required: true },
    shippingAddress: { type: AddressSchema, required: true },
    trackingNumber: { type: String },
  },
  { timestamps: true }
);

OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ paymentStatus: 1 });
OrderSchema.index({ paymentMethod: 1 });

const Order: Model<IOrderDocument> =
  mongoose.models.Order ||
  mongoose.model<IOrderDocument>("Order", OrderSchema);

export default Order;
