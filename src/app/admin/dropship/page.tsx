"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { formatPriceAUD } from "@/lib/utils";
import { Order } from "@/types/order";

type FulfillmentGroup = "pending" | "shipped" | "delivered" | "cancelled";

export default function AdminDropshipRoute() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [activeGroup, setActiveGroup] = useState<FulfillmentGroup>("pending");
  const [trackingDrafts, setTrackingDrafts] = useState<Record<string, string>>({});
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const load = async () => {
    const response = await fetch("/api/admin/dropship/orders", { cache: "no-store", credentials: "include" });
    const data = await response.json();
    setOrders(data.orders ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const grouped = useMemo(() => {
    const byGroup = {
      pending: [] as Order[],
      shipped: [] as Order[],
      delivered: [] as Order[],
      cancelled: [] as Order[],
    };
    for (const order of orders) {
      if (["cancelled", "refunded"].includes(order.status)) {
        byGroup.cancelled.push(order);
        continue;
      }
      if (order.fulfillmentStatus === "delivered") {
        byGroup.delivered.push(order);
        continue;
      }
      if (order.fulfillmentStatus === "shipped") {
        byGroup.shipped.push(order);
        continue;
      }
      byGroup.pending.push(order);
    }
    return byGroup;
  }, [orders]);

  const normalize = (value: string) =>
    value
      .toLowerCase()
      .replace(/^#/, "")
      .replace(/[^a-z0-9@.\s]/g, "")
      .trim();

  const filtered = useMemo(() => {
    const query = normalize(search);
    if (!query) return grouped[activeGroup];
    return grouped[activeGroup].filter((order) => {
      const shortId = order.id.slice(0, 8).toLowerCase();
      const fullId = order.id.toLowerCase();
      const email = (order.customerEmail ?? "").toLowerCase();
      const name = (order.customerName ?? "").toLowerCase();
      const country = (order.shippingAddress?.country ?? "").toLowerCase();
      const haystack = normalize(`${shortId} ${fullId} ${email} ${name} ${country}`);
      return haystack.includes(query);
    });
  }, [grouped, activeGroup, search]);

  const patchOrder = async (order: Order, body: Record<string, unknown>) => {
    const response = await fetch(`/api/admin/dropship/orders/${order.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      window.alert(data.error ?? "Update failed.");
      return;
    }
    await load();
  };

  const setOrderShipped = async (order: Order) => {
    await patchOrder(order, {
      status: "shipped",
      fulfillmentStatus: "shipped",
      trackingCode: trackingDrafts[order.id] ?? order.trackingCode ?? null,
    });
  };

  const setOrderDelivered = async (order: Order) => {
    await patchOrder(order, {
      status: "delivered",
      fulfillmentStatus: "delivered",
      trackingCode: trackingDrafts[order.id] ?? order.trackingCode ?? null,
    });
  };

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">Dropship orders</h2>
        <p className="mt-1 text-sm text-zinc-400">
          International and supplier-fulfilled orders. Customers receive a 17TRACK link when tracking is added.
        </p>
      </div>
      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search by order id, email, name, or country"
        className="min-h-10 w-full rounded-lg border border-white/15 bg-black/30 px-3 text-sm"
      />
      <div className="flex flex-wrap gap-2">
        {(["pending", "shipped", "delivered", "cancelled"] as FulfillmentGroup[]).map((group) => (
          <button
            key={group}
            type="button"
            onClick={() => setActiveGroup(group)}
            className={`rounded-full border px-3 py-1 text-xs capitalize ${
              activeGroup === group ? "border-zinc-100 bg-zinc-100 text-zinc-900" : "border-white/15 text-zinc-300"
            }`}
          >
            {group} ({grouped[group].length})
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {filtered.map((order) => (
          <article key={order.id} className="rounded-2xl border border-white/10 bg-black/25 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">#{order.id.slice(0, 8)}</p>
                <p className="text-xs text-zinc-500">{new Date(order.createdAt).toLocaleString()}</p>
                <p className="mt-1 text-xs text-zinc-400">
                  {order.customerName ?? "—"} · {order.customerEmail ?? "—"}
                </p>
                <p className="text-xs text-zinc-500">
                  Ship to: {order.shippingAddress?.city ?? "—"},{" "}
                  {order.shippingAddress?.country ?? "—"}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2 text-xs">
                <span className="rounded-full border border-white/15 px-2 py-1 text-zinc-300">
                  {order.fulfillmentStatus} · {order.paymentStatus}
                </span>
                <span className="text-zinc-500">{formatPriceAUD(order.revenueAUD)} paid</span>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <input
                value={trackingDrafts[order.id] ?? order.trackingCode ?? ""}
                onChange={(event) =>
                  setTrackingDrafts((prev) => ({ ...prev, [order.id]: event.target.value }))
                }
                placeholder="Tracking number"
                className="min-h-9 min-w-[200px] flex-1 rounded-lg border border-white/15 bg-black/30 px-2 text-xs"
              />
              {order.fulfillmentStatus === "pending" ? (
                <button
                  type="button"
                  onClick={() => setOrderShipped(order)}
                  className="rounded-lg border border-sky-400/40 bg-sky-500/10 px-3 py-1.5 text-xs text-sky-100 hover:bg-sky-500/20"
                >
                  Mark shipped
                </button>
              ) : null}
              {order.fulfillmentStatus === "shipped" ? (
                <button
                  type="button"
                  onClick={() => setOrderDelivered(order)}
                  className="rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-100 hover:bg-emerald-500/20"
                >
                  Mark delivered
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setSelectedOrder(order)}
                className="rounded-lg border border-white/20 px-3 py-1.5 text-xs hover:bg-white/10"
              >
                Details
              </button>
            </div>
          </article>
        ))}
        {filtered.length === 0 ? (
          <p className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-400">
            No orders in this group.
          </p>
        ) : null}
      </div>
      {selectedOrder ? (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/70 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-2xl border border-white/15 bg-zinc-950 p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xl font-semibold">Order #{selectedOrder.id.slice(0, 8)}</h3>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded-md border border-white/20 px-3 py-1.5 text-xs"
              >
                Close
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Info label="Customer email" value={selectedOrder.customerEmail ?? "N/A"} />
              <Info label="Payment" value={selectedOrder.paymentStatus} />
              <Info label="Fulfillment" value={selectedOrder.fulfillmentStatus} />
              <Info label="Tracking" value={selectedOrder.trackingCode ?? "Not set"} />
              <Info
                className="sm:col-span-2"
                label="Address"
                value={
                  selectedOrder.shippingAddress
                    ? `${selectedOrder.shippingAddress.firstName} ${selectedOrder.shippingAddress.lastName}, ${selectedOrder.shippingAddress.addressLine1}${selectedOrder.shippingAddress.addressLine2 ? `, ${selectedOrder.shippingAddress.addressLine2}` : ""}, ${selectedOrder.shippingAddress.city}, ${selectedOrder.shippingAddress.stateRegion} ${selectedOrder.shippingAddress.postcode}, ${selectedOrder.shippingAddress.country}`
                    : "No snapshot"
                }
              />
            </div>
            <div className="mt-4 space-y-2">
              <p className="text-sm font-semibold text-zinc-300">Items</p>
              {selectedOrder.items.map((item, index) => (
                <div
                  key={`${selectedOrder.id}-${item.variantId}-${index}`}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-2"
                >
                  <div className="relative h-14 w-14 overflow-hidden rounded border border-white/10 bg-black/40">
                    <Image src={item.image} alt={item.name} fill sizes="56px" className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="font-medium text-zinc-100">{item.name}</p>
                    <p className="text-xs text-zinc-400">
                      {item.color} · {item.size} · ×{item.quantity}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Info({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={`rounded-xl border border-white/10 bg-black/30 p-3 text-sm ${className ?? ""}`}>
      <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">{label}</p>
      <p className="mt-1 text-zinc-200">{value}</p>
    </div>
  );
}
