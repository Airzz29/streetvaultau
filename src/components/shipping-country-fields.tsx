"use client";

import { useMemo, useState } from "react";
import { SHIPPING_COUNTRIES } from "@/lib/currency-config";

type Props = {
  selectedCode: string;
  onSelect: (countryCode: string) => void;
  /** When true, list area is shorter (for dropdown). */
  compact?: boolean;
};

export function ShippingCountryFields({ selectedCode, onSelect, compact }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SHIPPING_COUNTRIES;
    return SHIPPING_COUNTRIES.filter(
      (row) => row.name.toLowerCase().includes(q) || row.code.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div className="space-y-2">
      <label className="sr-only" htmlFor="ship-country-search">
        Search countries
      </label>
      <input
        id="ship-country-search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search country…"
        className="min-h-10 w-full rounded-xl border border-white/15 bg-black/40 px-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500/60 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
      />
      <div
        className={`overflow-y-auto rounded-xl border border-white/10 bg-black/25 px-1 py-1 ${
          compact ? "max-h-[min(200px,35vh)]" : "max-h-[min(260px,42vh)]"
        }`}
      >
        <div className="grid gap-1">
          {filtered.map((row) => {
            const selected = selectedCode === row.code;
            return (
              <button
                key={row.code}
                type="button"
                onClick={() => onSelect(row.code)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition ${
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
          <p className="py-4 text-center text-sm text-zinc-500">No matches.</p>
        ) : null}
      </div>
    </div>
  );
}
