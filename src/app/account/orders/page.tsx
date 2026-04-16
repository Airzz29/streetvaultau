import { requireUser } from "@/lib/auth";
import { formatPriceAUD } from "@/lib/utils";
import { listOrdersByCustomerEmail, listOrdersByUserId, listReviewableOrderItems } from "@/lib/store-db";
import Image from "next/image";
import Link from "next/link";

export default async function AccountOrdersPage() {
  const user = await requireUser();
  if (!user) return null;
  const orders = Array.from(
    new Map(
      [...listOrdersByUserId(user.id), ...listOrdersByCustomerEmail(user.email)].map((order) => [order.id, order])
    ).values()
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const reviewables = listReviewableOrderItems(user.id);
  const reviewableByOrderItemId = new Map(
    reviewables.map((item) => [item.orderItemId, item.hasReview])
  );

  const customerStatusLabel = (order: (typeof orders)[number]) => {
    if (order.fulfillmentStatus === "delivered") return "Delivered";
    if (order.fulfillmentStatus === "shipped") return "Shipped";
    return "Order received / preparing for shipment";
  };

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Order history</h2>
      {orders.length === 0 ? (
        <p className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-400">
          No orders yet.
        </p>
      ) : (
        orders.map((order) => (
          <article key={order.id} className="space-y-3 rounded-2xl border border-white/10 bg-black/25 p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold">#{order.id.slice(0, 8)}</p>
                <p className="text-xs text-zinc-500">{new Date(order.createdAt).toLocaleString()}</p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs ${
                  order.fulfillmentStatus === "delivered"
                    ? "bg-emerald-500/20 text-emerald-200"
                    : order.fulfillmentStatus === "shipped"
                      ? "bg-sky-500/20 text-sky-200"
                      : "bg-zinc-500/20 text-zinc-200"
                }`}
              >
                {customerStatusLabel(order)}
              </span>
            </div>

            {order.trackingCode &&
            (order.fulfillmentStatus === "shipped" || order.fulfillmentStatus === "delivered") ? (
              <div className="rounded-xl border border-sky-400/30 bg-sky-500/10 p-3">
                <p className="text-xs text-sky-100">
                  {order.fulfillmentStatus === "delivered" ? "Delivered tracking:" : "Tracking:"}{" "}
                  {order.trackingCode}
                </p>
                <a
                  href={`https://auspost.com.au/mypost/track/details/${encodeURIComponent(order.trackingCode)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-900"
                >
                  Track
                </a>
              </div>
            ) : null}

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {order.items.map((item) => (
                <div
                  key={`${order.id}-${item.variantId}-${item.size}`}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-2"
                >
                  <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-white/10 bg-black/40">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                    <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-100">
                      x{item.quantity}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-100">{item.name}</p>
                    <p className="text-xs text-zinc-400">
                      Size {item.size} - {formatPriceAUD(item.unitPrice)} each
                    </p>
                    {item.orderItemId && order.paymentStatus === "paid" ? (
                      reviewableByOrderItemId.get(item.orderItemId) ? (
                        <span className="mt-1 inline-flex rounded border border-emerald-400/40 px-2 py-1 text-[11px] text-emerald-200">
                          Reviewed
                        </span>
                      ) : (
                        <Link
                          href={`/account/reviews?orderItemId=${encodeURIComponent(item.orderItemId)}`}
                          className="mt-1 inline-flex rounded border border-white/20 px-2 py-1 text-[11px] text-zinc-200 hover:bg-white/10"
                        >
                          Leave Review
                        </Link>
                      )
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-zinc-300">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span>{formatPriceAUD(order.subtotalAUD)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span>Shipping</span>
                <span>{formatPriceAUD(order.shippingAUD)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span>Discount{order.discountCode ? ` (${order.discountCode})` : ""}</span>
                <span>-{formatPriceAUD(order.discountAmountAUD ?? 0)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2 text-sm font-semibold">
                <span>Total paid</span>
                <span>{formatPriceAUD(order.revenueAUD)}</span>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-zinc-300">
              <p className="mb-1 font-semibold text-zinc-200">Shipping address</p>
              {order.shippingAddress ? (
                <p>
                  {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                  <br />
                  {order.shippingAddress.addressLine1}
                  {order.shippingAddress.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ""}
                  <br />
                  {order.shippingAddress.city}, {order.shippingAddress.stateRegion} {order.shippingAddress.postcode}
                  <br />
                  {order.shippingAddress.country}
                  {order.shippingAddress.phone ? ` · ${order.shippingAddress.phone}` : ""}
                </p>
              ) : (
                <p>No address snapshot found for this order.</p>
              )}
            </div>
          </article>
        ))
      )}
    </section>
  );
}

