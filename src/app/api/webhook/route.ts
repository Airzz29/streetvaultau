import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createPaidOrderFromStripeSession, getOrderById, listAdminUsers } from "@/lib/store-db";
import { sendAdminNewOrderAlertEmail, sendOrderConfirmationEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({
      received: false,
      message:
        "Missing signature or STRIPE_WEBHOOK_SECRET. Webhook verification is not configured yet.",
    });
  }

  try {
    const stripe = getStripe();
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const result = createPaidOrderFromStripeSession(session.id, {
        paid: true,
        customerEmail: session.customer_details?.email ?? null,
        customerName: session.customer_details?.name ?? null,
      });
      if (result.created && result.orderId) {
        const order = getOrderById(result.orderId);
        const fallbackEmail = session.customer_details?.email ?? null;
        const to = order?.customerEmail ?? fallbackEmail ?? null;
        // Respond to Stripe quickly; send mail after (avoids webhook timeouts under burst traffic).
        void (async () => {
          if (order && to) {
            try {
              await sendOrderConfirmationEmail({
                to,
                customerName: order.customerName,
                orderId: order.id,
                items: order.items.map((item) => ({
                  name: item.name,
                  size: item.size,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  image: item.image,
                })),
                totalAUD: order.revenueAUD,
              });
            } catch (error) {
              console.error("Order confirmation email error", error);
            }
          }
          if (order) {
            const adminRecipients = listAdminUsers()
              .map((admin) => admin.email)
              .filter((email) => Boolean(email?.trim()));
            if (adminRecipients.length) {
              try {
                await Promise.allSettled(
                  adminRecipients.map((email) =>
                    sendAdminNewOrderAlertEmail({
                      to: email,
                      orderId: order.id,
                      customerName: order.customerName,
                      customerEmail: order.customerEmail,
                      totalAUD: order.revenueAUD,
                      items: order.items.map((item) => ({
                        name: item.name,
                        size: item.size,
                        color: item.color,
                        quantity: item.quantity,
                        image: item.image,
                      })),
                    })
                  )
                );
              } catch (error) {
                console.error("Admin order alert email error", error);
              }
            }
          }
        })();
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error", error);
    return NextResponse.json({ received: false }, { status: 400 });
  }
}
