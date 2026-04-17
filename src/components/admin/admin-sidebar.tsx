"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/inventory", label: "Inventory" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/discounts", label: "Discounts" },
  { href: "/admin/marketing", label: "Marketing" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/contacts", label: "Contacts" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  return (
    <aside className="rounded-2xl border border-white/10 bg-black/25 p-3 backdrop-blur-xl">
      <p className="mb-2 px-2 text-xs uppercase tracking-[0.2em] text-zinc-500">Admin</p>
      <nav className="grid gap-1">
        {links.map((link) => {
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

