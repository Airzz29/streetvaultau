"use client";

import { useEffect, useState } from "react";
import { formatPriceAUD } from "@/lib/utils";

type Discount = {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  active: number;
  starts_at: string | null;
  expiry_at: string | null;
  usage_limit: number | null;
  minimum_order_aud: number | null;
};

export default function AdminDiscountsRoute() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [form, setForm] = useState({
    code: "",
    discountType: "percentage" as "percentage" | "fixed",
    discountValue: "10",
    active: true,
    startsAt: "",
    expiryAt: "",
    usageLimit: "",
    minimumOrderAUD: "",
  });
  const [message, setMessage] = useState("");

  const toInputDateTime = (date: Date) => {
    const pad = (v: number) => String(v).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate()
    )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const applyPreset = (days: number) => {
    const start = new Date();
    const end = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
    setForm((prev) => ({
      ...prev,
      startsAt: toInputDateTime(start),
      expiryAt: toInputDateTime(end),
    }));
  };

  const load = async () => {
    const response = await fetch("/api/admin/discounts", {
      cache: "no-store",
      credentials: "include",
    });
    const data = await response.json();
    setDiscounts(data.discounts ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">Discount Codes</h2>
      <form
        className="grid gap-2 rounded-2xl border border-white/10 bg-black/25 p-4 sm:grid-cols-3"
        onSubmit={async (event) => {
          event.preventDefault();
          setMessage("");
          const response = await fetch("/api/admin/discounts", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              code: form.code.trim().toUpperCase(),
              discountType: form.discountType,
              discountValue: Number(form.discountValue || 0),
              active: form.active,
              startsAt: form.startsAt || null,
              expiryAt: form.expiryAt || null,
              usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
              minimumOrderAUD: form.minimumOrderAUD ? Number(form.minimumOrderAUD) : null,
            }),
          });
          const result = await response.json();
          if (!response.ok) {
            setMessage(result.error ?? "Unable to create discount.");
            return;
          }
          setForm((prev) => ({ ...prev, code: "", discountValue: "10" }));
          setMessage("Discount code created.");
          await load();
        }}
      >
        <input value={form.code} onChange={(e) => setForm((v) => ({ ...v, code: e.target.value }))} placeholder="Code" className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm" required />
        <select value={form.discountType} onChange={(e) => setForm((v) => ({ ...v, discountType: e.target.value as "percentage" | "fixed" }))} className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm">
          <option value="percentage">Percentage</option>
          <option value="fixed">Fixed AUD</option>
        </select>
        <input value={form.discountValue} onChange={(e) => setForm((v) => ({ ...v, discountValue: e.target.value }))} placeholder="Value" className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm" />
        <input value={form.minimumOrderAUD} onChange={(e) => setForm((v) => ({ ...v, minimumOrderAUD: e.target.value }))} placeholder="Minimum order AUD" className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm" />
        <input value={form.usageLimit} onChange={(e) => setForm((v) => ({ ...v, usageLimit: e.target.value }))} placeholder="Usage limit" className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm" />
        <input type="datetime-local" value={form.startsAt} onChange={(e) => setForm((v) => ({ ...v, startsAt: e.target.value }))} className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm" title="Start date/time (optional)" />
        <input type="datetime-local" value={form.expiryAt} onChange={(e) => setForm((v) => ({ ...v, expiryAt: e.target.value }))} className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm" />
        <div className="flex items-center gap-2 sm:col-span-3">
          <span className="text-xs text-zinc-400">Quick presets:</span>
          <button type="button" onClick={() => applyPreset(1)} className="rounded border border-white/20 px-2 py-1 text-xs hover:bg-white/10">1 day</button>
          <button type="button" onClick={() => applyPreset(3)} className="rounded border border-white/20 px-2 py-1 text-xs hover:bg-white/10">3 days</button>
          <button type="button" onClick={() => applyPreset(7)} className="rounded border border-white/20 px-2 py-1 text-xs hover:bg-white/10">7 days</button>
          <button type="button" onClick={() => setForm((v) => ({ ...v, startsAt: "", expiryAt: "" }))} className="rounded border border-white/20 px-2 py-1 text-xs hover:bg-white/10">Clear timing</button>
        </div>
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input checked={form.active} onChange={(e) => setForm((v) => ({ ...v, active: e.target.checked }))} type="checkbox" />
          Active
        </label>
        <button className="rounded-lg bg-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-900">Create Code</button>
      </form>
      {message ? <p className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{message}</p> : null}
      <div className="space-y-2">
        {discounts.map((discount) => (
          <article key={discount.id} className="rounded-2xl border border-white/10 bg-black/25 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">{discount.code}</p>
              <span className={`rounded-full px-2 py-1 text-xs ${discount.active ? "bg-emerald-500/20 text-emerald-200" : "bg-zinc-700/40 text-zinc-300"}`}>
                {discount.active ? "Active" : "Inactive"}
              </span>
            </div>
            <p className="mt-1 text-sm text-zinc-400">
              {discount.discount_type === "percentage" ? `${discount.discount_value}% off` : `${formatPriceAUD(discount.discount_value)} off`}
              {discount.minimum_order_aud ? ` · Min ${formatPriceAUD(discount.minimum_order_aud)}` : ""}
              {discount.usage_limit ? ` · Limit ${discount.usage_limit}` : ""}
            </p>
            {discount.starts_at ? <p className="text-xs text-zinc-500">Starts {new Date(discount.starts_at).toLocaleString()}</p> : null}
            {discount.expiry_at ? <p className="text-xs text-zinc-500">Expires {new Date(discount.expiry_at).toLocaleString()}</p> : null}
            <button
              onClick={async () => {
                await fetch("/api/admin/discounts", {
                  method: "PATCH",
                  credentials: "include",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    id: discount.id,
                    code: discount.code,
                    discountType: discount.discount_type,
                    discountValue: discount.discount_value,
                    active: !Boolean(discount.active),
                    startsAt: discount.starts_at,
                    expiryAt: discount.expiry_at,
                    usageLimit: discount.usage_limit,
                    minimumOrderAUD: discount.minimum_order_aud,
                  }),
                });
                await load();
              }}
              className="mt-3 rounded-lg border border-white/20 px-3 py-2 text-xs hover:bg-white/10"
            >
              Toggle Active
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

