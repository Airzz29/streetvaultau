"use client";

import { FormEvent, useEffect, useState } from "react";

export default function AdminSettingsRoute() {
  const [lowStockThreshold, setLowStockThreshold] = useState(3);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings", { cache: "no-store", credentials: "include" })
      .then((r) => r.json())
      .then((data) => setLowStockThreshold(data.lowStockThreshold ?? 3));
  }, []);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    await fetch("/api/admin/settings", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lowStockThreshold }),
    });
    setMessage("Settings updated.");
  };

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">Store Settings</h2>
      <form onSubmit={onSubmit} className="rounded-2xl border border-white/10 bg-black/25 p-4">
        <label className="grid gap-2 text-sm">
          <span className="text-zinc-300">Global low-stock threshold</span>
          <input
            type="number"
            value={lowStockThreshold}
            onChange={(event) => setLowStockThreshold(Number(event.target.value || 1))}
            className="rounded-lg border border-white/15 bg-black/30 px-3 py-2"
          />
        </label>
        <button className="mt-3 rounded-lg bg-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-900">Save</button>
      </form>
      {message ? <p className="text-sm text-zinc-300">{message}</p> : null}
    </section>
  );
}

