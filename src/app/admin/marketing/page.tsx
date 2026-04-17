"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type MarketingProduct = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  newArrival: boolean;
  bestSeller: boolean;
  compareAtPrice: number | null;
  minPrice: number;
};

type MarketingDiscount = {
  id: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  expiryAt: string | null;
};

export default function AdminMarketingPage() {
  const [loading, setLoading] = useState(true);
  const [subscribersCount, setSubscribersCount] = useState(0);
  const [products, setProducts] = useState<MarketingProduct[]>([]);
  const [discounts, setDiscounts] = useState<MarketingDiscount[]>([]);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    subject: "",
    headline: "",
    body: "",
    ctaLabel: "Shop Now",
    ctaUrl: "",
    testEmail: "",
  });

  const load = async () => {
    setLoading(true);
    const response = await fetch("/api/admin/marketing", {
      cache: "no-store",
      credentials: "include",
    });
    const data = await response.json();
    if (response.ok) {
      setSubscribersCount(data.subscribersCount ?? 0);
      setProducts(data.products ?? []);
      setDiscounts(data.discounts ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const productShortcuts = useMemo(
    () =>
      products
        .filter((product) => product.active)
        .slice(0, 8)
        .map((product) => ({
          id: product.id,
          label: product.name,
          apply: () =>
            setForm((prev) => ({
              ...prev,
              subject: `New drop: ${product.name}`,
              headline: `${product.name} just landed`,
              body: `StreetVault just released ${product.name}.\n\nTap below to view the drop before it sells out.`,
              ctaLabel: "View New Drop",
              ctaUrl: `/product/${product.slug}`,
            })),
        })),
    [products]
  );

  const discountShortcuts = useMemo(
    () =>
      discounts.slice(0, 8).map((discount) => ({
        id: discount.id,
        label: discount.code,
        apply: () =>
          setForm((prev) => ({
            ...prev,
            subject: `StreetVault offer: ${discount.code}`,
            headline: `Limited offer: ${discount.code}`,
            body: `Use code ${discount.code} at checkout for ${
              discount.discountType === "percentage"
                ? `${discount.discountValue}% off`
                : `${discount.discountValue.toFixed(2)} AUD off`
            }.\n\nStock and offer availability may be limited.`,
            ctaLabel: "Shop Offer",
            ctaUrl: "/shop",
          })),
      })),
    [discounts]
  );

  const sendCampaign = async (mode: "test" | "subscribers") => {
    setMessage("");
    const response = await fetch("/api/admin/marketing", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        sendMode: mode,
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.error ?? "Unable to send campaign.");
      return;
    }
    if (mode === "test") {
      setMessage("Test email sent.");
      return;
    }
    setMessage(
      `Campaign sent to ${result.sentCount ?? 0} subscribers${
        result.failedCount ? ` (${result.failedCount} failed)` : ""
      }.`
    );
  };

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">Marketing</h2>
      <div className="rounded-2xl border border-white/10 bg-black/25 p-4 text-sm">
        <p className="text-zinc-300">Opted-in subscribers</p>
        <p className="mt-1 text-2xl font-semibold text-zinc-100">
          {loading ? "..." : subscribersCount}
        </p>
      </div>

      <form
        className="space-y-3 rounded-2xl border border-white/10 bg-black/25 p-4"
        onSubmit={(event: FormEvent) => {
          event.preventDefault();
          void sendCampaign("subscribers");
        }}
      >
        <p className="text-sm font-semibold">Compose campaign</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={form.subject}
            onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))}
            placeholder="Email subject"
            className="min-h-10 rounded-lg border border-white/15 bg-black/30 px-3 text-sm sm:col-span-2"
            required
          />
          <input
            value={form.headline}
            onChange={(event) => setForm((prev) => ({ ...prev, headline: event.target.value }))}
            placeholder="Headline"
            className="min-h-10 rounded-lg border border-white/15 bg-black/30 px-3 text-sm sm:col-span-2"
            required
          />
          <textarea
            value={form.body}
            onChange={(event) => setForm((prev) => ({ ...prev, body: event.target.value }))}
            placeholder="Campaign body"
            className="min-h-32 rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm sm:col-span-2"
            required
          />
          <input
            value={form.ctaLabel}
            onChange={(event) => setForm((prev) => ({ ...prev, ctaLabel: event.target.value }))}
            placeholder="CTA label"
            className="min-h-10 rounded-lg border border-white/15 bg-black/30 px-3 text-sm"
          />
          <input
            value={form.ctaUrl}
            onChange={(event) => setForm((prev) => ({ ...prev, ctaUrl: event.target.value }))}
            placeholder="CTA path or URL (e.g. /shop)"
            className="min-h-10 rounded-lg border border-white/15 bg-black/30 px-3 text-sm"
          />
          <input
            value={form.testEmail}
            onChange={(event) => setForm((prev) => ({ ...prev, testEmail: event.target.value }))}
            placeholder="Test email address"
            className="min-h-10 rounded-lg border border-white/15 bg-black/30 px-3 text-sm sm:col-span-2"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void sendCampaign("test")}
            className="rounded-lg border border-white/20 px-3 py-2 text-xs hover:bg-white/10"
          >
            Send Test
          </button>
          <button className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-900">
            Send to Subscribers
          </button>
        </div>
      </form>

      <div className="grid gap-3 rounded-2xl border border-white/10 bg-black/25 p-4 lg:grid-cols-2">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.18em] text-zinc-500">New Drop Shortcuts</p>
          <div className="flex flex-wrap gap-2">
            {productShortcuts.map((shortcut) => (
              <button
                key={shortcut.id}
                type="button"
                onClick={shortcut.apply}
                className="rounded-full border border-white/20 px-3 py-1.5 text-xs hover:bg-white/10"
              >
                {shortcut.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.18em] text-zinc-500">Discount Shortcuts</p>
          <div className="flex flex-wrap gap-2">
            {discountShortcuts.map((shortcut) => (
              <button
                key={shortcut.id}
                type="button"
                onClick={shortcut.apply}
                className="rounded-full border border-white/20 px-3 py-1.5 text-xs hover:bg-white/10"
              >
                {shortcut.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {message ? (
        <p className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {message}
        </p>
      ) : null}
    </section>
  );
}
