"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { formatPriceAUD } from "@/lib/utils";
import { Order } from "@/types/order";

type FulfillmentGroup = "pending" | "shipped" | "delivered" | "cancelled";

export default function AdminOrdersRoute() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [activeGroup, setActiveGroup] = useState<FulfillmentGroup>("pending");
  const [trackingDrafts, setTrackingDrafts] = useState<Record<string, string>>({});
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const load = async () => {
    const response = await fetch("/api/admin/orders", { cache: "no-store", credentials: "include" });
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

  const filtered = useMemo(
    () => {
      const query = normalize(search);
      if (!query) return grouped[activeGroup];
      return grouped[activeGroup].filter((order) => {
        const shortId = order.id.slice(0, 8).toLowerCase();
        const fullId = order.id.toLowerCase();
        const email = (order.customerEmail ?? "").toLowerCase();
        const name = (order.customerName ?? "").toLowerCase();
        const haystack = normalize(`${shortId} ${fullId} ${email} ${name}`);
        return haystack.includes(query);
      });
    },
    [grouped, activeGroup, search]
  );

  const setOrderShipped = async (order: Order) => {
    await fetch(`/api/admin/orders/${order.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "shipped",
        fulfillmentStatus: "shipped",
        trackingCode: trackingDrafts[order.id] ?? order.trackingCode ?? null,
      }),
    });
    await load();
  };

  const setOrderDelivered = async (order: Order) => {
    await fetch(`/api/admin/orders/${order.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "delivered",
        fulfillmentStatus: "delivered",
        trackingCode: trackingDrafts[order.id] ?? order.trackingCode ?? null,
      }),
    });
    await load();
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-2xl font-semibold">Orders</h2>
        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by #order, email, or name"
            className="rounded-md border border-white/15 bg-black/30 px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div className="grid gap-2 rounded-2xl border border-white/10 bg-black/25 p-3 sm:grid-cols-4">
        {[
          { id: "pending", label: "Pending Fulfillment", count: grouped.pending.length },
          { id: "shipped", label: "Shipped", count: grouped.shipped.length },
          { id: "delivered", label: "Delivered", count: grouped.delivered.length },
          { id: "cancelled", label: "Cancelled", count: grouped.cancelled.length },
        ].map((group) => (
          <button
            key={group.id}
            type="button"
            onClick={() => setActiveGroup(group.id as FulfillmentGroup)}
            className={`rounded-xl border px-3 py-2 text-left transition ${
              activeGroup === group.id
                ? "border-zinc-100 bg-zinc-100 text-zinc-900"
                : "border-white/10 bg-black/20 text-zinc-300 hover:bg-white/10"
            }`}
          >
            <p className="text-xs uppercase tracking-[0.14em]">{group.label}</p>
            <p className="mt-1 text-lg font-semibold">{group.count}</p>
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {filtered.map((order) => (
          <article key={order.id} className="rounded-2xl border border-white/10 bg-black/25 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold">#{order.id.slice(0, 8)}</p>
                <p className="text-sm text-zinc-400">{order.customerEmail ?? "No email"}</p>
                <p className="text-xs text-zinc-500">{order.userId ? `User ${order.userId.slice(0, 8)}` : "Guest/legacy"}</p>
              </div>
              <p className="text-sm font-semibold">{formatPriceAUD(order.revenueAUD)}</p>
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-4">
              <input
                value={trackingDrafts[order.id] ?? order.trackingCode ?? ""}
                onChange={(e) => setTrackingDrafts((prev) => ({ ...prev, [order.id]: e.target.value }))}
                placeholder="Tracking code"
                className="rounded-md border border-white/15 bg-black/30 px-2 py-2 text-xs"
              />
              <button
                onClick={() => setOrderShipped(order)}
                className="rounded-md border border-white/20 px-2 py-2 text-xs hover:bg-white/10"
              >
                Mark shipped
              </button>
              <button
                onClick={() => setOrderDelivered(order)}
                className="rounded-md border border-white/20 px-2 py-2 text-xs hover:bg-white/10"
              >
                Mark delivered
              </button>
              <button
                type="button"
                onClick={() => setSelectedOrder(order)}
                className="rounded-md border border-zinc-300/30 bg-zinc-100/10 px-2 py-2 text-xs text-zinc-100 hover:bg-zinc-100/20 md:col-span-4"
              >
                View More Details
              </button>
            </div>
          </article>
        ))}
        {filtered.length === 0 ? (
          <p className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-400">
            No orders match your search in this status group.
          </p>
        ) : null}
      </div>
      {selectedOrder ? (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/70 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-2xl border border-white/15 bg-zinc-950 p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xl font-semibold">Order #{selectedOrder.id.slice(0, 8)}</h3>
              <button type="button" onClick={() => setSelectedOrder(null)} className="rounded-md border border-white/20 px-3 py-1.5 text-xs">
                Close
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Info label="Customer name" value={selectedOrder.customerName ?? "N/A"} />
              <Info label="Customer email" value={selectedOrder.customerEmail ?? "N/A"} />
              <Info label="Order status" value={selectedOrder.status} />
              <Info label="Payment status" value={selectedOrder.paymentStatus} />
              <Info label="Fulfillment status" value={selectedOrder.fulfillmentStatus} />
              <Info label="Date" value={new Date(selectedOrder.createdAt).toLocaleString()} />
              <Info label="Tracking number" value={selectedOrder.trackingCode ?? "Not set"} />
              <Info
                label="Shipping address"
                value={
                  selectedOrder.shippingAddress
                    ? `${selectedOrder.shippingAddress.firstName} ${selectedOrder.shippingAddress.lastName}, ${selectedOrder.shippingAddress.addressLine1}${selectedOrder.shippingAddress.addressLine2 ? `, ${selectedOrder.shippingAddress.addressLine2}` : ""}, ${selectedOrder.shippingAddress.city}, ${selectedOrder.shippingAddress.stateRegion} ${selectedOrder.shippingAddress.postcode}, ${selectedOrder.shippingAddress.country}`
                    : "No snapshot"
                }
              />
            </div>
            <div className="mt-4">
              <p className="mb-2 text-sm font-semibold text-zinc-300">Purchased items</p>
              <div className="grid gap-2">
                {selectedOrder.items.map((item) => (
                  <div key={`${selectedOrder.id}-${item.variantId}-${item.size}`} className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-2">
                    <div className="relative h-16 w-16 overflow-hidden rounded border border-white/10 bg-black/40">
                      <Image src={item.image} alt={item.name} fill sizes="64px" className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-zinc-100">{item.name}</p>
                      <p className="text-xs text-zinc-400">Size {item.size} · Qty {item.quantity} · {formatPriceAUD(item.unitPrice)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-sm">
      <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">{label}</p>
      <p className="mt-1 text-zinc-200">{value}</p>
    </div>
  );
}

