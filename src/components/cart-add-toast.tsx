"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "@/context/cart-context";

export function CartAddToast() {
  const { recentAdd, dismissRecentAdd } = useCart();

  useEffect(() => {
    if (!recentAdd) return;
    const timer = window.setTimeout(dismissRecentAdd, 2600);
    return () => window.clearTimeout(timer);
  }, [dismissRecentAdd, recentAdd]);

  if (!recentAdd) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[70] flex justify-center px-4">
      <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-white/20 bg-black/70 p-3 backdrop-blur-xl animate-in slide-in-from-bottom-4 fade-in duration-300">
        <div className="flex items-center gap-3">
          <div className="relative h-14 w-14 overflow-hidden rounded-lg border border-white/20">
            <Image
              src={recentAdd.image}
              alt={recentAdd.name}
              fill
              sizes="56px"
              className="object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Added to cart</p>
            <p className="truncate text-sm font-semibold">{recentAdd.name}</p>
            <p className="text-xs text-zinc-300">
              {recentAdd.color} / {recentAdd.size} / Qty {recentAdd.quantity}
            </p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Link
            href="/cart"
            className="rounded-lg bg-zinc-100 px-3 py-2 text-center text-xs font-semibold text-zinc-950"
          >
            View Cart
          </Link>
          <button
            onClick={dismissRecentAdd}
            className="rounded-lg border border-white/20 px-3 py-2 text-xs text-zinc-100"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}
