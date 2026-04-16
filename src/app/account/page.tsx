import { requireUser } from "@/lib/auth";
import { listOrdersByCustomerEmail, listOrdersByUserId } from "@/lib/store-db";
import { formatPriceAUD } from "@/lib/utils";

export default async function AccountOverviewPage() {
  const user = await requireUser();
  if (!user) return null;
  const orders = Array.from(
    new Map(
      [...listOrdersByUserId(user.id), ...listOrdersByCustomerEmail(user.email)].map((order) => [order.id, order])
    ).values()
  );
  const totalSpend = orders.reduce((sum, order) => sum + order.revenueAUD, 0);
  const latestOrder = orders[0];
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <article className="rounded-2xl border border-white/10 bg-black/25 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Total Orders</p>
        <p className="mt-2 text-2xl font-semibold">{orders.length}</p>
      </article>
      <article className="rounded-2xl border border-white/10 bg-black/25 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Lifetime Spend</p>
        <p className="mt-2 text-2xl font-semibold">{formatPriceAUD(totalSpend)}</p>
      </article>
      <article className="rounded-2xl border border-white/10 bg-black/25 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Marketing Opt-In</p>
        <p className="mt-2 text-2xl font-semibold">{user.marketingOptIn ? "Yes" : "No"}</p>
      </article>
      <article className="rounded-2xl border border-white/10 bg-black/25 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Last Active</p>
        <p className="mt-2 text-sm font-semibold">
          {user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleString() : "Just now"}
        </p>
      </article>
      <article className="rounded-2xl border border-white/10 bg-black/25 p-4 sm:col-span-2 lg:col-span-4">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Latest Order</p>
        <p className="mt-2 text-sm font-semibold">
          {latestOrder
            ? `#${latestOrder.id.slice(0, 8)} - ${formatPriceAUD(latestOrder.revenueAUD)} - ${latestOrder.status}`
            : "No orders yet"}
        </p>
      </article>
    </div>
  );
}

