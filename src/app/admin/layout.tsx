"use client";

import { usePathname } from "next/navigation";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminLogoutButton } from "@/components/admin/admin-logout-button";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/admin/login") {
    return <>{children}</>;
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

