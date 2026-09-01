import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import { generateOrderNumber } from "@/lib/utils";

const ESEWA_PRODUCT_CODE = process.env.ESEWA_PRODUCT_CODE!; // e.g. "EPAYTEST"
const ESEWA_SECRET_KEY = process.env.ESEWA_SECRET_KEY!;
const ESEWA_PAYMENT_URL =
  process.env.ESEWA_PAYMENT_URL ?? "https://rc-epay.esewa.com.np/api/epay/main/v2/form";

/**
 * Sign must use the EXACT same string values that are sent in the form fields.
 * eSewa verifies by re-hashing the received form data — any format mismatch
 * (e.g. '50' vs '50.00') causes ES104 Invalid payload signature.
 */
function esewaSign(
  totalAmountStr: string,
  transactionUuid: string,
  productCode: string
): string {
  const message = `total_amount=${totalAmountStr},transaction_uuid=${transactionUuid},product_code=${productCode}`;
  return crypto
    .createHmac("sha256", ESEWA_SECRET_KEY)
    .update(message)
    .digest("base64");
}

export async function POST(req: NextRequest) {
  try {
    const { items, userId } = await req.json();

    // Calculate totals
    const subtotal: number = items.reduce(
      (sum: number, item: { price: number; quantity: number }) =>
        sum + item.price * item.quantity,
      0
    );
    const shippingFee = subtotal >= 100 ? 0 : 9.99;
    const totalAmount = parseFloat((subtotal + shippingFee).toFixed(2));

    // Build a unique transaction UUID for this payment attempt
    const transactionUuid = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    // Persist a PENDING order so we can fulfill it on eSewa callback
    await connectDB();
    await Order.create({
      orderNumber: generateOrderNumber(),
      user: userId && userId !== "guest" ? userId : undefined,
      status: "PENDING",
      totalAmount,
      paymentStatus: "UNPAID",
      esewaTransactionId: transactionUuid,
      items: items.map(
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
      ),
      // Placeholder address — updated when eSewa calls back with shipping info
      shippingAddress: {
        line1: "Pending",
        city: "Pending",
        state: "Pending",
        postalCode: "00000",
        country: "NP",
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

    // Format all monetary amounts as strings with exactly 2 decimal places.
    // The signature MUST be computed from the same string values that go in the form.
    const amountStr = subtotal.toFixed(2);
    const totalAmountStr = totalAmount.toFixed(2);
    const shippingStr = shippingFee.toFixed(2);

    const signature = esewaSign(totalAmountStr, transactionUuid, ESEWA_PRODUCT_CODE);

    // Build eSewa form payload
    const payload = {
      amount: amountStr,
      tax_amount: "0",
      total_amount: totalAmountStr,
      transaction_uuid: transactionUuid,
      product_code: ESEWA_PRODUCT_CODE,
      product_service_charge: "0",
      product_delivery_charge: shippingStr,
      success_url: `${appUrl}/api/esewa/verify`,
      failure_url: `${appUrl}/checkout`,
      signed_field_names: "total_amount,transaction_uuid,product_code",
      signature,
    };

    return NextResponse.json({ url: ESEWA_PAYMENT_URL, payload });
  } catch (error) {
    console.error("eSewa checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
