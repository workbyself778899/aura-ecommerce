"use server";

import connectDB from "@/lib/mongodb";
import PaymentSettings from "@/models/PaymentSettings";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type {
  IPublicPaymentSettings,
  IPaymentSettings,
  IEsewaSettings,
  IQrPaymentSettings,
} from "@/types";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized: Admin access required");
  }
  return session;
}

const defaultSettings = {
  esewa: {
    enabled: true,
    productCode: process.env.ESEWA_PRODUCT_CODE || "EPAYTEST",
    secretKey: process.env.ESEWA_SECRET_KEY || "8gBm/:&EnhH.1/q",
    paymentUrl:
      process.env.ESEWA_PAYMENT_URL ||
      "https://rc-epay.esewa.com.np/api/epay/main/v2/form",
    statusUrl:
      process.env.ESEWA_STATUS_URL ||
      "https://rc.esewa.com.np/api/epay/transaction/status/",
  },
  qrPayment: {
    enabled: true,
    bankName: "Nabil Bank",
    accountName: "Aura Commerce Pvt. Ltd.",
    accountNumber: "01234567890123",
    branch: "Main Branch, Kathmandu",
    bankQrImageUrl: "",
    esewaQrImageUrl: "",
    esewaId: "9800000000",
    instructions:
      "Scan the QR code to pay using your Mobile Banking or eSewa app. Once payment is completed, please upload the screenshot or PDF receipt as proof.",
  },
  cashOnDelivery: {
    enabled: false,
  },
};

/**
 * Public function to get enabled payment options for checkout
 */
export async function getPublicPaymentSettings(): Promise<IPublicPaymentSettings> {
  await connectDB();
  const settings = await PaymentSettings.findOne().lean();

  if (!settings) {
    return {
      esewa: { enabled: defaultSettings.esewa.enabled },
      qrPayment: {
        enabled: defaultSettings.qrPayment.enabled,
        bankName: defaultSettings.qrPayment.bankName,
        accountName: defaultSettings.qrPayment.accountName,
        accountNumber: defaultSettings.qrPayment.accountNumber,
        branch: defaultSettings.qrPayment.branch,
        bankQrImageUrl: defaultSettings.qrPayment.bankQrImageUrl,
        esewaQrImageUrl: defaultSettings.qrPayment.esewaQrImageUrl,
        esewaId: defaultSettings.qrPayment.esewaId,
        instructions: defaultSettings.qrPayment.instructions,
      },
      cashOnDelivery: { enabled: defaultSettings.cashOnDelivery.enabled },
    };
  }

  return {
    esewa: {
      enabled: settings.esewa?.enabled ?? true,
    },
    qrPayment: {
      enabled: settings.qrPayment?.enabled ?? true,
      bankName: settings.qrPayment?.bankName || defaultSettings.qrPayment.bankName,
      accountName:
        settings.qrPayment?.accountName || defaultSettings.qrPayment.accountName,
      accountNumber:
        settings.qrPayment?.accountNumber || defaultSettings.qrPayment.accountNumber,
      branch: settings.qrPayment?.branch || defaultSettings.qrPayment.branch,
      bankQrImageUrl: settings.qrPayment?.bankQrImageUrl || "",
      esewaQrImageUrl: settings.qrPayment?.esewaQrImageUrl || "",
      esewaId: settings.qrPayment?.esewaId || defaultSettings.qrPayment.esewaId,
      instructions:
        settings.qrPayment?.instructions || defaultSettings.qrPayment.instructions,
    },
    cashOnDelivery: {
      enabled: settings.cashOnDelivery?.enabled ?? false,
    },
  };
}

/**
 * Admin function to get all payment settings including secret keys
 */
export async function getAdminPaymentSettings(): Promise<IPaymentSettings> {
  await requireAdmin();
  await connectDB();

  let settings = await PaymentSettings.findOne().lean();

  if (!settings) {
    // Create initial default document
    const created = await PaymentSettings.create(defaultSettings);
    settings = created.toObject();
  }

  return {
    _id: String(settings._id),
    esewa: {
      enabled: settings.esewa?.enabled ?? true,
      productCode:
        settings.esewa?.productCode || defaultSettings.esewa.productCode,
      secretKey: settings.esewa?.secretKey || defaultSettings.esewa.secretKey,
      paymentUrl:
        settings.esewa?.paymentUrl || defaultSettings.esewa.paymentUrl,
      statusUrl: settings.esewa?.statusUrl || defaultSettings.esewa.statusUrl,
    },
    qrPayment: {
      enabled: settings.qrPayment?.enabled ?? true,
      bankName: settings.qrPayment?.bankName || defaultSettings.qrPayment.bankName,
      accountName:
        settings.qrPayment?.accountName || defaultSettings.qrPayment.accountName,
      accountNumber:
        settings.qrPayment?.accountNumber || defaultSettings.qrPayment.accountNumber,
      branch: settings.qrPayment?.branch || defaultSettings.qrPayment.branch,
      bankQrImageUrl: settings.qrPayment?.bankQrImageUrl || "",
      esewaQrImageUrl: settings.qrPayment?.esewaQrImageUrl || "",
      esewaId: settings.qrPayment?.esewaId || defaultSettings.qrPayment.esewaId,
      instructions:
        settings.qrPayment?.instructions || defaultSettings.qrPayment.instructions,
    },
    cashOnDelivery: {
      enabled: settings.cashOnDelivery?.enabled ?? false,
    },
    updatedAt: settings.updatedAt ? new Date(settings.updatedAt).toISOString() : undefined,
  };
}

/**
 * Admin function to update payment settings
 */
export async function updatePaymentSettings(data: {
  esewa: IEsewaSettings;
  qrPayment: IQrPaymentSettings;
  cashOnDelivery?: { enabled: boolean };
}): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  await connectDB();

  try {
    const existing = await PaymentSettings.findOne();

    if (existing) {
      existing.esewa = data.esewa;
      existing.qrPayment = data.qrPayment;
      if (data.cashOnDelivery) {
        existing.cashOnDelivery = data.cashOnDelivery;
      }
      await existing.save();
    } else {
      await PaymentSettings.create(data);
    }

    revalidatePath("/admin/settings/payments");
    revalidatePath("/checkout");

    return { success: true };
  } catch (error) {
    console.error("Failed to update payment settings:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update payment settings",
    };
  }
}

/**
 * Admin function to approve a manual QR / Bank payment proof
 */
export async function approveOrderPayment(orderId: string): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  await connectDB();

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return { success: false, error: "Order not found" };
    }

    const wasAlreadyPaid = order.paymentStatus === "PAID";
    order.paymentStatus = "PAID";
    if (order.status === "PENDING") {
      order.status = "PROCESSING";
    }
    await order.save();

    // Decrement product stock if not already decremented
    if (!wasAlreadyPaid) {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stockQuantity: -item.quantity },
        });
      }
    }

    revalidatePath("/admin/orders");
    revalidatePath(`/account/orders`);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to approve payment",
    };
  }
}

/**
 * Admin function to reject or mark a manual payment as unpaid
 */
export async function rejectOrderPayment(
  orderId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  await connectDB();

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return { success: false, error: "Order not found" };
    }

    order.paymentStatus = "UNPAID";
    if (reason) {
      order.customerNotes = (order.customerNotes ? order.customerNotes + "\n" : "") + `[Admin Note]: ${reason}`;
    }
    await order.save();

    revalidatePath("/admin/orders");
    revalidatePath(`/account/orders`);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reject payment",
    };
  }
}
