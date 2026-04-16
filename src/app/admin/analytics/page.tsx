"use client";

import { useEffect, useState } from "react";
import { formatPriceAUD } from "@/lib/utils";

type AnalyticsData = {
  totalRevenueAUD: number;
  totalProfitAUD: number;
  totalOrders: number;
  totalSignedUpUsers: number;
  activeUsersNow: number;
  visitorsLast30Days: number;
  topCustomers: Array<{ email: string; orders: number; spend: number }>;
  recentCustomerPurchases: Array<{
    orderId: string;
    customerEmail: string | null;
    revenueAUD: number;
    createdAt: string;
  }>;
};

export default function AdminAnalyticsRoute() {
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    fetch("/api/admin/dashboard", { cache: "no-store", credentials: "include" })
      .then((r) => r.json())
      .then(setData);
  }, []);

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">Analytics</h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <MetricCard label="Revenue" value={formatPriceAUD(data?.totalRevenueAUD ?? 0)} />
        <MetricCard label="Profit" value={formatPriceAUD(data?.totalProfitAUD ?? 0)} />
        <MetricCard label="Orders" value={String(data?.totalOrders ?? 0)} />
        <MetricCard label="Signed-up Users" value={String(data?.totalSignedUpUsers ?? 0)} />
        <MetricCard label="Active Users (15m)" value={String(data?.activeUsersNow ?? 0)} />
        <MetricCard label="Visitors (30d)" value={String(data?.visitorsLast30Days ?? 0)} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-white/10 bg-black/25 p-4">
          <h3 className="text-lg font-semibold">Top Customers</h3>
          <div className="mt-3 space-y-2 text-sm">
            {(data?.topCustomers ?? []).map((customer) => (
              <div key={customer.email} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                <span className="truncate">{customer.email}</span>
                <span>{customer.orders} orders · {formatPriceAUD(customer.spend)}</span>
              </div>
            ))}
          </div>
        </article>
        <article className="rounded-2xl border border-white/10 bg-black/25 p-4">
          <h3 className="text-lg font-semibold">Recent Customer Purchases</h3>
          <div className="mt-3 space-y-2 text-sm">
            {(data?.recentCustomerPurchases ?? []).map((purchase) => (
              <div key={purchase.orderId} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                <p className="font-medium">{purchase.customerEmail ?? "Unknown"} · #{purchase.orderId.slice(0, 8)}</p>
                <p className="text-zinc-400">{formatPriceAUD(purchase.revenueAUD)} · {new Date(purchase.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </article>
      </div>
      <p className="text-xs text-zinc-500">
        Active users are distinct users with authenticated session activity in the last 15 minutes.
        Visitors 30d are distinct authenticated sessions seen in the last 30 days.
      </p>
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </article>
  );
}

