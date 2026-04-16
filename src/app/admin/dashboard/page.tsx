"use client";

import { useEffect, useState } from "react";
import { formatPriceAUD } from "@/lib/utils";

type DashboardData = {
  totalRevenueAUD: number;
  totalProfitAUD: number;
  totalOrders: number;
  pendingOrders: number;
  paidOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  lowStockProducts: number;
  totalSignedUpUsers: number;
  activeUsersNow: number;
  visitorsLast30Days: number;
};

export default function AdminDashboardRoute() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/admin/dashboard", { cache: "no-store", credentials: "include" })
      .then((r) => r.json())
      .then(setData);
  }, []);

  const cards = [
    { label: "Revenue", value: formatPriceAUD(data?.totalRevenueAUD ?? 0) },
    { label: "Profit", value: formatPriceAUD(data?.totalProfitAUD ?? 0) },
    { label: "Orders", value: String(data?.totalOrders ?? 0) },
    { label: "Pending", value: String(data?.pendingOrders ?? 0) },
    { label: "Paid", value: String(data?.paidOrders ?? 0) },
    { label: "Shipped", value: String(data?.shippedOrders ?? 0) },
    { label: "Delivered", value: String(data?.deliveredOrders ?? 0) },
    { label: "Low Stock", value: String(data?.lowStockProducts ?? 0) },
    { label: "Signed-up Users", value: String(data?.totalSignedUpUsers ?? 0) },
    { label: "Active Now (15m)", value: String(data?.activeUsersNow ?? 0) },
    { label: "Visitors 30d", value: String(data?.visitorsLast30Days ?? 0) },
  ];

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">Dashboard Overview</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <article key={card.label} className="rounded-2xl border border-white/10 bg-black/25 p-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">{card.label}</p>
            <p className="mt-2 text-xl font-semibold">{card.value}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

