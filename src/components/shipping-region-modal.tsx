"use client";

import { useEffect, useMemo, useState } from "react";
import { SHIPPING_COUNTRIES } from "@/lib/currency-config";
import { useCurrency } from "@/context/currency-context";

const SESSION_CONFIRMED = "sv-shipping-region-confirmed-session";

export function ShippingRegionModal() {
  const { shippingCountryCode, setShippingCountry } = useCurrency();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [draftCountry, setDraftCountry] = useState<string>(() => shippingCountryCode ?? "AU");

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_CONFIRMED) === "1") {
        setOpen(false);
        return;
      }
      setOpen(true);
    } catch {
      setOpen(true);
    }
  }, []);

  useEffect(() => {
    if (shippingCountryCode) setDraftCountry(shippingCountryCode);
  }, [shippingCountryCode]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SHIPPING_COUNTRIES;
    return SHIPPING_COUNTRIES.filter(
      (row) =>
        row.name.toLowerCase().includes(q) || row.code.toLowerCase().includes(q)
    );
  }, [query]);

  const confirm = () => {
    setShippingCountry(draftCountry);
    try {
      sessionStorage.setItem(SESSION_CONFIRMED, "1");
    } catch {
      // ignore
    }
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/75 p-3 backdrop-blur-sm sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="shipping-region-title"
        className="max-h-[min(560px,90vh)] w-full max-w-lg overflow-hidden rounded-2xl border border-white/15 bg-zinc-950 shadow-2xl"
      >
        <div className="border-b border-white/10 px-5 py-4">
          <h2 id="shipping-region-title" className="text-lg font-semibold text-zinc-50">
            Where are we shipping?
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            Choose your country — we&apos;ll show prices in a matching currency. You can change this anytime from the menu.
          </p>
          <label className="sr-only" htmlFor="shipping-region-search">
            Search countries
          </label>
          <input
            id="shipping-region-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search country…"
            className="mt-4 min-h-11 w-full rounded-xl border border-white/15 bg-black/40 px-4 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500/60 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
          />
        </div>
        <div className="max-h-[min(260px,42vh)] overflow-y-auto px-3 py-2">
          <div className="grid gap-1">
            {filtered.map((row) => {
              const selected = draftCountry === row.code;
              return (
                <button
                  key={row.code}
                  type="button"
                  onClick={() => setDraftCountry(row.code)}
                  className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm transition ${
                    selected
                      ? "border border-amber-500/70 bg-amber-500/10 text-amber-50"
                      : "border border-transparent bg-white/[0.03] text-zinc-200 hover:bg-white/[0.06]"
                  }`}
                >
                  <span>{row.name}</span>
                  <span className="text-xs uppercase tracking-wide text-zinc-500">{row.currency}</span>
                </button>
              );
            })}
          </div>
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-zinc-500">No matches. Try another search.</p>
          ) : null}
        </div>
        <div className="border-t border-white/10 p-4">
          <button
            type="button"
            onClick={confirm}
            className="min-h-12 w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-sm font-semibold text-zinc-950 shadow-lg shadow-orange-950/40 transition hover:brightness-105"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
