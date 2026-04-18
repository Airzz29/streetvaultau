"use client";

import { useEffect, useRef, useState } from "react";
import { CURRENCY_OPTIONS, type CurrencyCode } from "@/lib/currency-config";
import { useCurrency } from "@/context/currency-context";

export function CurrencyPickerButton() {
  const { currency, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<CurrencyCode>(currency);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPending(currency);
  }, [currency]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const active = CURRENCY_OPTIONS.find((c) => c.code === currency);
  const label = active ? `${active.label} ${active.symbol}` : currency;

  const confirm = () => {
    setCurrency(pending);
    setOpen(false);
  };

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex min-h-11 max-w-[9rem] items-center justify-center gap-1 rounded-full border border-zinc-700/60 px-3 text-xs font-medium text-zinc-200 hover:border-amber-500/50 sm:max-w-none sm:px-4 sm:text-sm"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <span className="truncate">{label}</span>
        <span className="text-zinc-500" aria-hidden>
          ▾
        </span>
      </button>
      {open ? (
        <div className="absolute right-0 top-[calc(100%+8px)] z-[95] w-[min(100vw-2rem,22rem)] rounded-2xl border border-white/15 bg-zinc-950 p-4 shadow-2xl">
          <p className="mb-3 text-xs uppercase tracking-[0.18em] text-zinc-500">Currency</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {CURRENCY_OPTIONS.map((opt) => {
              const selected = pending === opt.code;
              return (
                <button
                  key={opt.code}
                  type="button"
                  onClick={() => setPending(opt.code)}
                  className={`rounded-xl border px-2 py-2.5 text-center text-xs font-medium transition sm:text-sm ${
                    selected
                      ? "border-amber-500 bg-amber-500/10 text-amber-100 shadow-[0_0_0_1px_rgba(245,158,11,0.35)]"
                      : "border-zinc-700/80 bg-black/30 text-zinc-300 hover:border-zinc-500"
                  }`}
                >
                  {opt.label}{" "}
                  <span className="text-zinc-400">{opt.symbol}</span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={confirm}
            className="mt-4 min-h-11 w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-sm font-semibold text-zinc-950 hover:brightness-105"
          >
            Confirm
          </button>
        </div>
      ) : null}
    </div>
  );
}
