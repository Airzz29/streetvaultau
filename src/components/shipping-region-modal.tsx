"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useCurrency } from "@/context/currency-context";
import { ShippingCountryFields } from "@/components/shipping-country-fields";

const SESSION_CONFIRMED = "sv-shipping-region-confirmed-session";

export function ShippingRegionModal() {
  const { shippingCountryCode, setShippingCountry } = useCurrency();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [draftCountry, setDraftCountry] = useState<string>(() => shippingCountryCode ?? "AU");

  useEffect(() => setMounted(true), []);

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

  useEffect(() => {
    if (!open || !mounted) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, mounted]);

  const confirm = () => {
    try {
      sessionStorage.setItem(SESSION_CONFIRMED, "1");
    } catch {
      // ignore
    }
    setOpen(false);
    setShippingCountry(draftCountry);
  };

  if (!mounted || !open) return null;

  const modal = (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/75 p-3 backdrop-blur-sm sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="shipping-region-title"
        className="max-h-[min(560px,90vh)] w-full max-w-lg overflow-hidden rounded-2xl border border-white/15 bg-zinc-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-white/10 px-5 py-4">
          <h2 id="shipping-region-title" className="text-lg font-semibold text-zinc-50">
            Where are we shipping?
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            Choose your country — we&apos;ll show prices in a matching currency. You can change this anytime from the bar.
          </p>
        </div>
        <div className="px-5 py-3">
          <ShippingCountryFields selectedCode={draftCountry} onSelect={setDraftCountry} />
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

  return createPortal(modal, document.body);
}
