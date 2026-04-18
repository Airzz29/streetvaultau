"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { AdminPageKey } from "@/lib/admin-permissions";
import { hasAdminPermission } from "@/lib/admin-permissions";

const links: { href: string; label: string; key: AdminPageKey }[] = [
  { href: "/admin/dashboard", label: "Dashboard", key: "dashboard" },
  { href: "/admin/products", label: "Products", key: "products" },
  { href: "/admin/premade-fits", label: "Premade Fits", key: "premade-fits" },
  { href: "/admin/inventory", label: "Inventory", key: "inventory" },
  { href: "/admin/orders", label: "Orders (local)", key: "orders" },
  { href: "/admin/dropship", label: "Dropship", key: "dropship" },
  { href: "/admin/users", label: "Users", key: "users" },
  { href: "/admin/discounts", label: "Discounts", key: "discounts" },
  { href: "/admin/marketing", label: "Marketing", key: "marketing" },
  { href: "/admin/analytics", label: "Analytics", key: "analytics" },
  { href: "/admin/contacts", label: "Contacts", key: "contacts" },
  { href: "/admin/reviews", label: "Reviews", key: "reviews" },
  { href: "/admin/settings", label: "Settings", key: "settings" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [perms, setPerms] = useState<unknown>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/session", { cache: "no-store", credentials: "include" })
      .then((r) => r.json())
      .then((data: { user?: { adminPermissions?: unknown } }) => {
        if (!cancelled) setPerms(data.user?.adminPermissions);
      })
      .catch(() => {
        if (!cancelled) setPerms(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const visible =
    perms === undefined
      ? links
      : links.filter((link) => hasAdminPermission(perms as never, link.key));

  return (
    <aside className="rounded-2xl border border-white/10 bg-black/25 p-3 backdrop-blur-xl">
      <p className="mb-2 px-2 text-xs uppercase tracking-[0.2em] text-zinc-500">Admin</p>
      <nav className="grid gap-1">
        {visible.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-xl border px-3 py-2 text-sm transition ${
                active
                  ? "border-zinc-100 bg-zinc-100 text-zinc-900"
                  : "border-white/10 bg-black/20 text-zinc-300 hover:bg-white/10"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
