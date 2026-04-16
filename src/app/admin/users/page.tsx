"use client";

import { useEffect, useMemo, useState } from "react";
import { formatPriceAUD } from "@/lib/utils";

type AdminUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  marketingOptIn: boolean;
  createdAt: string;
  lastActiveAt: string | null;
  orderCount: number;
  totalSpendAUD: number;
  addresses: Array<{ id: string; city: string; stateRegion: string; country: string }>;
};

export default function AdminUsersRoute() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/users", { cache: "no-store", credentials: "include" })
      .then((r) => r.json())
      .then((data) => setUsers(data.users ?? []));
  }, []);

  const filtered = useMemo(
    () =>
      users.filter((user) =>
        `${user.firstName} ${user.lastName} ${user.email}`.toLowerCase().includes(search.toLowerCase())
      ),
    [users, search]
  );

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">Users</h2>
      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search users by name or email"
        className="min-h-10 w-full rounded-lg border border-white/15 bg-black/30 px-3 text-sm"
      />
      <div className="space-y-3">
        {filtered.map((user) => (
          <article key={user.id} className="rounded-2xl border border-white/10 bg-black/25 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-base font-semibold">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-zinc-400">{user.role}</p>
            </div>
            <p className="mt-1 text-sm text-zinc-300">{user.email}</p>
            <p className="mt-1 text-xs text-zinc-400">
              Marketing opt-in: {user.marketingOptIn ? "Yes" : "No"} · Created {new Date(user.createdAt).toLocaleDateString()}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Last active: {user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleString() : "N/A"} · Orders: {user.orderCount} · Spend: {formatPriceAUD(user.totalSpendAUD)}
            </p>
            {user.addresses.length ? (
              <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-zinc-400">
                {user.addresses.slice(0, 3).map((addr) => (
                  <span key={addr.id} className="rounded-full border border-white/10 px-2 py-1">
                    {addr.city}, {addr.stateRegion}, {addr.country}
                  </span>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

