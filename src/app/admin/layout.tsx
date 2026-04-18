"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminLogoutButton } from "@/components/admin/admin-logout-button";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isFullAdmin, setIsFullAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/session", { cache: "no-store", credentials: "include" })
      .then((r) => r.json())
      .then((data: { user?: { role?: string } }) => {
        if (!cancelled) setIsFullAdmin(data.user?.role === "admin");
      })
      .catch(() => {
        if (!cancelled) setIsFullAdmin(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (pathname.startsWith("/admin/dropship")) {
    return (
      <section className="space-y-6">
        <div className="rounded-2xl border border-white/15 bg-black/30 p-6 backdrop-blur-xl">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Fulfillment</p>
              <h1 className="text-3xl font-semibold">Dropship &amp; international</h1>
              <p className="mt-2 text-sm text-zinc-300">
                Global line orders · enter tracking when the carrier provides it (links use 17TRACK).
              </p>
              {isFullAdmin ? (
                <Link
                  href="/admin/dashboard"
                  className="mt-3 inline-flex text-sm text-zinc-300 underline underline-offset-4 hover:text-zinc-100"
                >
                  ← Back to full admin
                </Link>
              ) : null}
            </div>
            <AdminLogoutButton />
          </div>
        </div>
        <div className="space-y-6">{children}</div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-white/15 bg-black/30 p-6 backdrop-blur-xl">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">StreetVault Admin</h1>
            <p className="mt-2 text-sm text-zinc-300">Standalone operations dashboard by section.</p>
          </div>
          <AdminLogoutButton />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <AdminSidebar />
        <div className="space-y-6">{children}</div>
      </div>
    </section>
  );
}

