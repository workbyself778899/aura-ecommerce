import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import stripe from "@/lib/stripe";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { generateOrderNumber } from "@/lib/utils";
import type Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();
  const sig = headersList.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    try {
      await connectDB();

      const metadata = session.metadata ?? {};
      const parsedItems = metadata.items ? JSON.parse(metadata.items) : [];

      // Build order items and decrement stock
      const orderItems = [];
      for (const item of parsedItems) {
        const product = await Product.findById(item.productId);
        if (product) {
          orderItems.push({
            productId: product._id,
            title: product.title,
            price: item.price,
            quantity: item.quantity,
            imageUrl: product.images[0]?.url,
            variantName: item.variantName,
            sku: product.sku,
          });

          // Decrement stock
          await Product.findByIdAndUpdate(item.productId, {
            $inc: { stockQuantity: -item.quantity },
          });
        }
      }

      // Build shipping address
      // shipping_details is present on Checkout sessions but not typed in the SDK
      type ShippingDetails = {
        address?: {
          line1?: string | null;
          line2?: string | null;
          city?: string | null;
          state?: string | null;
          postal_code?: string | null;
          country?: string | null;
        };
      };
      const shipping = (session as unknown as { shipping_details?: ShippingDetails }).shipping_details;
      const shippingAddress = shipping?.address

        ? {
            line1: shipping.address.line1 ?? "",
            line2: shipping.address.line2 ?? "",
            city: shipping.address.city ?? "",
            state: shipping.address.state ?? "",
            postalCode: shipping.address.postal_code ?? "",
            country: shipping.address.country ?? "US",
          }
        : {
            line1: "N/A",
            city: "N/A",
            state: "N/A",
            postalCode: "N/A",
            country: "US",
          };

      // Create order if not already exists
      const existing = await Order.findOne({
        stripeCheckoutSessionId: session.id,
      });

      if (!existing) {
        await Order.create({
          orderNumber: generateOrderNumber(),
          user: metadata.userId !== "guest" ? metadata.userId : undefined,
          status: "PROCESSING",
          totalAmount: (session.amount_total ?? 0) / 100,
          paymentStatus: "PAID",
          stripeCheckoutSessionId: session.id,
          stripePaymentIntentId:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent?.id,
          items: orderItems,
          shippingAddress,
        });
      }
    } catch (err) {
      console.error("Error processing webhook:", err);
      return NextResponse.json(
        { error: "Webhook processing failed" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true });
}
