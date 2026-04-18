import {
  getOrderById,
  markOrderDeliveredEmailSent,
  markOrderShippingEmailSent,
  updateOrderStatus,
} from "@/lib/store-db";
import { Order, OrderStatus } from "@/types/order";
import { sendDeliveredConfirmationEmail, sendShippingConfirmationEmail } from "@/lib/email";
import type { TrackingProvider } from "@/lib/tracking-links";

const allowedStatuses: OrderStatus[] = [
  "pending_payment",
  "pending_fulfillment",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

export type OrderFulfillmentPatchBody = {
  status?: OrderStatus;
  fulfillmentStatus?: "pending" | "shipped" | "delivered";
  trackingCode?: string | null;
  carrier?: string | null;
  shippingNotes?: string | null;
  internalNotes?: string | null;
};

export async function applyOrderFulfillmentPatch(
  orderId: string,
  body: OrderFulfillmentPatchBody,
  actorRole: "admin" | "supplier"
): Promise<{ ok: true; order: Order } | { ok: false; status: number; error: string }> {
  if (!body.status || !allowedStatuses.includes(body.status)) {
    return { ok: false, status: 400, error: "Invalid status." };
  }

  const before = getOrderById(orderId);
  if (!before) {
    return { ok: false, status: 404, error: "Order not found." };
  }

  if (actorRole === "supplier") {
    if (before.fulfillmentChannel !== "dropship") {
      return { ok: false, status: 403, error: "Forbidden." };
    }
    if (["cancelled", "refunded", "pending_payment"].includes(body.status)) {
      return { ok: false, status: 403, error: "Forbidden." };
    }
  }

  updateOrderStatus(orderId, {
    status: body.status,
    fulfillmentStatus: body.fulfillmentStatus ?? "pending",
    trackingCode: body.trackingCode ?? null,
    carrier: body.carrier ?? null,
    shippingNotes: body.shippingNotes ?? null,
    internalNotes: body.internalNotes ?? null,
  });

  const updated = getOrderById(orderId);
  if (!updated) {
    return { ok: false, status: 404, error: "Order not found." };
  }

  const trackingProvider: TrackingProvider =
    updated.trackingProvider ??
    (updated.fulfillmentChannel === "dropship" ? "global17" : "auspost");

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
        trackingProvider,
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

  return { ok: true, order: updated };
}
