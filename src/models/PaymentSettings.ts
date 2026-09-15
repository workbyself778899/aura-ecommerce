import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPaymentSettingsDocument extends Document {
  esewa: {
    enabled: boolean;
    productCode: string;
    secretKey: string;
    paymentUrl: string;
    statusUrl: string;
  };
  qrPayment: {
    enabled: boolean;
    bankName: string;
    accountName: string;
    accountNumber: string;
    branch?: string;
    bankQrImageUrl?: string;
    esewaQrImageUrl?: string;
    esewaId?: string;
    instructions?: string;
  };
  cashOnDelivery: {
    enabled: boolean;
  };
  updatedAt: Date;
  createdAt: Date;
}

const PaymentSettingsSchema = new Schema<IPaymentSettingsDocument>(
  {
    esewa: {
      enabled: { type: Boolean, default: true },
      productCode: {
        type: String,
        default: process.env.ESEWA_PRODUCT_CODE || "EPAYTEST",
      },
      secretKey: {
        type: String,
        default: process.env.ESEWA_SECRET_KEY || "8gBm/:&EnhH.1/q",
      },
      paymentUrl: {
        type: String,
        default:
          process.env.ESEWA_PAYMENT_URL ||
          "https://rc-epay.esewa.com.np/api/epay/main/v2/form",
      },
      statusUrl: {
        type: String,
        default:
          process.env.ESEWA_STATUS_URL ||
          "https://rc.esewa.com.np/api/epay/transaction/status/",
      },
    },
    qrPayment: {
      enabled: { type: Boolean, default: true },
      bankName: { type: String, default: "Nabil Bank" },
      accountName: { type: String, default: "Aura Commerce Pvt. Ltd." },
      accountNumber: { type: String, default: "01234567890123" },
      branch: { type: String, default: "Main Branch, Kathmandu" },
      bankQrImageUrl: { type: String, default: "" },
      esewaQrImageUrl: { type: String, default: "" },
      esewaId: { type: String, default: "9800000000" },
      instructions: {
        type: String,
        default:
          "Scan the QR code to pay using your Mobile Banking or eSewa app. Once payment is completed, please upload the screenshot or PDF receipt as proof.",
      },
    },
    cashOnDelivery: {
      enabled: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

const PaymentSettings: Model<IPaymentSettingsDocument> =
  mongoose.models.PaymentSettings ||
  mongoose.model<IPaymentSettingsDocument>("PaymentSettings", PaymentSettingsSchema);

export default PaymentSettings;
