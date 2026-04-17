import { NextRequest, NextResponse } from "next/server";
import {
  getOrderById,
  listOrders,
  markOrderDeliveredEmailSent,
  markOrderShippingEmailSent,
  updateOrderStatus,
} from "@/lib/store-db";
import { OrderStatus } from "@/types/order";
import { requireAdmin } from "@/lib/auth";
import { sendDeliveredConfirmationEmail, sendShippingConfirmationEmail } from "@/lib/email";

const allowedStatuses: OrderStatus[] = [
  "pending_payment",
  "pending_fulfillment",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as {
    status?: OrderStatus;
    fulfillmentStatus?: "pending" | "shipped" | "delivered";
    trackingCode?: string | null;
    carrier?: string | null;
    shippingNotes?: string | null;
    internalNotes?: string | null;
  };
  if (!body.status || !allowedStatuses.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const orderExists = listOrders().some((order) => order.id === params.id);
  if (!orderExists) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const before = getOrderById(params.id);
  updateOrderStatus(params.id, {
    status: body.status,
    fulfillmentStatus: body.fulfillmentStatus ?? "pending",
    trackingCode: body.trackingCode ?? null,
    carrier: body.carrier ?? null,
    shippingNotes: body.shippingNotes ?? null,
    internalNotes: body.internalNotes ?? null,
  });
  const updated = listOrders().find((order) => order.id === params.id);
  if (!updated) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const shouldSendShippingEmail = Boolean(
    before &&
      updated.paymentStatus === "paid" &&
      updated.fulfillmentStatus === "shipped" &&
      updated.trackingCode &&
      !before.shippingEmailSentAt &&
      !updated.shippingEmailSentAt
  );
  if (shouldSendShippingEmail && updated.customerEmail) {
    try {
      await sendShippingConfirmationEmail({
        to: updated.customerEmail,
        customerName: updated.customerName,
        orderId: updated.id,
        trackingNumber: updated.trackingCode as string,
        items: updated.items.map((item) => ({
          name: item.name,
          size: item.size,
          quantity: item.quantity,
          image: item.image,
        })),
      });
      markOrderShippingEmailSent(updated.id);
    } catch (error) {
      console.error("Shipping confirmation email failed", {
        orderId: updated.id,
        error,
      });
    }
  }

  const shouldSendDeliveredEmail = Boolean(
    before &&
      updated.paymentStatus === "paid" &&
      updated.fulfillmentStatus === "delivered" &&
      before.fulfillmentStatus !== "delivered" &&
      !before.deliveredEmailSentAt &&
      !updated.deliveredEmailSentAt
  );
  if (shouldSendDeliveredEmail && updated.customerEmail) {
    try {
      await sendDeliveredConfirmationEmail({
        to: updated.customerEmail,
        customerName: updated.customerName,
        orderId: updated.id,
        items: updated.items.map((item) => ({
          name: item.name,
          size: item.size,
          quantity: item.quantity,
          image: item.image,
        })),
      });
      markOrderDeliveredEmailSent(updated.id);
    } catch (error) {
      console.error("Delivered confirmation email failed", {
        orderId: updated.id,
        error,
      });
    }
  }

  return NextResponse.json({ order: updated });
}
