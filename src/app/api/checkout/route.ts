import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import PaymentSettings from "@/models/PaymentSettings";
import { generateOrderNumber } from "@/lib/utils";

function esewaSign(
  totalAmountStr: string,
  transactionUuid: string,
  productCode: string,
  secretKey: string
): string {
  const message = `total_amount=${totalAmountStr},transaction_uuid=${transactionUuid},product_code=${productCode}`;
  return crypto
    .createHmac("sha256", secretKey)
    .update(message)
    .digest("base64");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      items,
      userId,
      paymentMethod = "ESEWA",
      shippingAddress,
      paymentProof,
      customerNotes,
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    await connectDB();
    const settings = await PaymentSettings.findOne().lean();

    const esewaConfig = {
      enabled: settings?.esewa?.enabled ?? true,
      productCode: settings?.esewa?.productCode || process.env.ESEWA_PRODUCT_CODE || "EPAYTEST",
      secretKey: settings?.esewa?.secretKey || process.env.ESEWA_SECRET_KEY || "8gBm/:&EnhH.1/q",
      paymentUrl:
        settings?.esewa?.paymentUrl ||
        process.env.ESEWA_PAYMENT_URL ||
        "https://rc-epay.esewa.com.np/api/epay/main/v2/form",
      statusUrl:
        settings?.esewa?.statusUrl ||
        process.env.ESEWA_STATUS_URL ||
        "https://rc.esewa.com.np/api/epay/transaction/status/",
    };

    const qrConfig = {
      enabled: settings?.qrPayment?.enabled ?? true,
    };

    // Calculate totals
    const subtotal: number = items.reduce(
      (sum: number, item: { price: number; quantity: number }) =>
        sum + item.price * item.quantity,
      0
    );
    const shippingFee = subtotal >= 100 ? 0 : 9.99;
    const totalAmount = parseFloat((subtotal + shippingFee).toFixed(2));

    const formattedAddress = {
      fullName: shippingAddress?.fullName || "Guest Customer",
      phone: shippingAddress?.phone || "",
      line1: shippingAddress?.line1 || "Street Address",
      line2: shippingAddress?.line2 || "",
      city: shippingAddress?.city || "Kathmandu",
      state: shippingAddress?.state || "Bagmati",
      postalCode: shippingAddress?.postalCode || "44600",
      country: shippingAddress?.country || "NP",
    };

    const orderItems = items.map(
      (i: {
        productId: string;
        title: string;
        price: number;
        quantity: number;
        imageUrl?: string;
        variantName?: string;
        sku?: string;
      }) => ({
        productId: i.productId,
        title: i.title,
        price: i.price,
        quantity: i.quantity,
        imageUrl: i.imageUrl,
        variantName: i.variantName,
        sku: i.sku,
      })
    );

    // ==========================================
    // 1. QR Code / Manual Bank/eSewa Transfer
    // ==========================================
    if (paymentMethod === "QR_CODE") {
      if (!qrConfig.enabled) {
        return NextResponse.json(
          { error: "QR Code / Bank Transfer payment is currently disabled." },
          { status: 400 }
        );
      }

      if (!paymentProof?.fileUrl) {
        return NextResponse.json(
          { error: "Payment proof receipt (screenshot or PDF) is required." },
          { status: 400 }
        );
      }

      const orderNumber = generateOrderNumber();
      const order = await Order.create({
        orderNumber,
        user: userId && userId !== "guest" ? userId : undefined,
        status: "PENDING",
        totalAmount,
        paymentStatus: "UNDER_REVIEW",
        paymentMethod: "QR_CODE",
        paymentProof: {
          fileUrl: paymentProof.fileUrl,
          fileName: paymentProof.fileName || "receipt",
          fileType: paymentProof.fileType || "image/jpeg",
          notes: paymentProof.notes || customerNotes || "",
          uploadedAt: new Date(),
        },
        customerNotes,
        items: orderItems,
        shippingAddress: formattedAddress,
      });

      return NextResponse.json({
        success: true,
        paymentMethod: "QR_CODE",
        orderId: String(order._id),
        orderNumber: order.orderNumber,
      });
    }

    // ==========================================
    // 2. Cash On Delivery
    // ==========================================
    if (paymentMethod === "CASH_ON_DELIVERY") {
      const codEnabled = settings?.cashOnDelivery?.enabled ?? false;
      if (!codEnabled) {
        return NextResponse.json(
          { error: "Cash on delivery is currently disabled." },
          { status: 400 }
        );
      }

      const orderNumber = generateOrderNumber();
      const order = await Order.create({
        orderNumber,
        user: userId && userId !== "guest" ? userId : undefined,
        status: "PENDING",
        totalAmount,
        paymentStatus: "UNPAID",
        paymentMethod: "CASH_ON_DELIVERY",
        customerNotes,
        items: orderItems,
        shippingAddress: formattedAddress,
      });

      return NextResponse.json({
        success: true,
        paymentMethod: "CASH_ON_DELIVERY",
        orderId: String(order._id),
        orderNumber: order.orderNumber,
      });
    }

    // ==========================================
    // 3. eSewa Payment Gateway
    // ==========================================
    if (!esewaConfig.enabled) {
      return NextResponse.json(
        { error: "eSewa payment is currently disabled by administrator." },
        { status: 400 }
      );
    }

    const transactionUuid = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    await Order.create({
      orderNumber: generateOrderNumber(),
      user: userId && userId !== "guest" ? userId : undefined,
      status: "PENDING",
      totalAmount,
      paymentStatus: "UNPAID",
      paymentMethod: "ESEWA",
      esewaTransactionId: transactionUuid,
      customerNotes,
      items: orderItems,
      shippingAddress: formattedAddress,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const amountStr = subtotal.toFixed(2);
    const totalAmountStr = totalAmount.toFixed(2);
    const shippingStr = shippingFee.toFixed(2);

    const signature = esewaSign(
      totalAmountStr,
      transactionUuid,
      esewaConfig.productCode,
      esewaConfig.secretKey
    );

    const payload = {
      amount: amountStr,
      tax_amount: "0",
      total_amount: totalAmountStr,
      transaction_uuid: transactionUuid,
      product_code: esewaConfig.productCode,
      product_service_charge: "0",
      product_delivery_charge: shippingStr,
      success_url: `${appUrl}/api/esewa/verify`,
      failure_url: `${appUrl}/checkout`,
      signed_field_names: "total_amount,transaction_uuid,product_code",
      signature,
    };

    return NextResponse.json({
      success: true,
      paymentMethod: "ESEWA",
      url: esewaConfig.paymentUrl,
      payload,
    });
  } catch (error) {
    console.error("Checkout API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process checkout" },
      { status: 500 }
    );
  }
}
