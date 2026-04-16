"use client";

import { useState } from "react";

export function AdminLogoutButton() {
  const [loading, setLoading] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        setLoading(true);
        try {
          await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
          window.location.href = "/admin/login";
        } finally {
          setLoading(false);
        }
      }}
      disabled={loading}
      className="rounded-xl border border-white/20 px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-white/10 disabled:opacity-60"
    >
      {loading ? "Signing out..." : "Log out"}
    </button>
  );
}

