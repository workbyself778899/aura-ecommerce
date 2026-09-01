import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import Product from "@/models/Product";

const ESEWA_PRODUCT_CODE = process.env.ESEWA_PRODUCT_CODE!;
const ESEWA_SECRET_KEY = process.env.ESEWA_SECRET_KEY!;
const ESEWA_STATUS_URL =
  process.env.ESEWA_STATUS_URL ??
  "https://rc.esewa.com.np/api/epay/transaction/status/";

function verifySignature(
  totalAmount: string,
  transactionUuid: string,
  productCode: string,
  receivedSignature: string
): boolean {
  const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
  const expected = crypto
    .createHmac("sha256", ESEWA_SECRET_KEY)
    .update(message)
    .digest("base64");
  return expected === receivedSignature;
}

/**
 * eSewa redirects the customer back to this URL as GET with base64-encoded data.
 * Query param: ?data=<base64-json>
 */
export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  try {
    const { searchParams } = new URL(req.url);
    const encoded = searchParams.get("data");

    if (!encoded) {
      return NextResponse.redirect(`${appUrl}/checkout?error=missing_data`);
    }

    // Decode eSewa response
    const decoded = JSON.parse(Buffer.from(encoded, "base64").toString("utf-8"));
    const {
      transaction_uuid,
      total_amount,
      transaction_code,
      status,
      signature: receivedSignature,
    } = decoded;

    if (status !== "COMPLETE") {
      return NextResponse.redirect(`${appUrl}/checkout?error=payment_failed`);
    }

    // Verify signature to prevent tampering
    const isValid = verifySignature(
      total_amount,
      transaction_uuid,
      ESEWA_PRODUCT_CODE,
      receivedSignature
    );

    if (!isValid) {
      console.error("eSewa signature mismatch", {
        transaction_uuid,
        total_amount,
        receivedSignature,
      });
      return NextResponse.redirect(`${appUrl}/checkout?error=invalid_signature`);
    }

    // Double-check with eSewa status API
    const statusUrl = `${ESEWA_STATUS_URL}?product_code=${ESEWA_PRODUCT_CODE}&transaction_uuid=${transaction_uuid}&total_amount=${total_amount}`;
    console.log("eSewa status check URL:", statusUrl);

    const statusRes = await fetch(statusUrl);
    const statusData = await statusRes.json();
    console.log("eSewa status response:", statusData);

    if (statusData.status !== "COMPLETE") {
      console.error("eSewa status not COMPLETE:", statusData);
      return NextResponse.redirect(`${appUrl}/checkout?error=unverified`);
    }

    await connectDB();

    // Find by the transaction UUID we stored during checkout creation
    const order = await Order.findOne({ esewaTransactionId: transaction_uuid });

    if (!order) {
      console.error("Order not found for eSewa transaction_uuid:", transaction_uuid);
      // Still redirect to success to avoid bad UX — the order may have been created
      return NextResponse.redirect(`${appUrl}/checkout/success`);
    }

    if (order.paymentStatus === "PAID") {
      // Already processed — idempotent redirect
      return NextResponse.redirect(`${appUrl}/checkout/success`);
    }

    // Mark order as paid and update transaction ID to the final transaction_code
    order.paymentStatus = "PAID";
    order.status = "PROCESSING";
    order.esewaTransactionId = transaction_code || transaction_uuid;
    await order.save();

    // Decrement stock for each item
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stockQuantity: -item.quantity },
      });
    }

    return NextResponse.redirect(`${appUrl}/checkout/success`);
  } catch (err) {
    console.error("eSewa verification error:", err);
    return NextResponse.redirect(`${appUrl}/checkout?error=server_error`);
  }
}
