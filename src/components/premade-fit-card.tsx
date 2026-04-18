"use client";

import Image from "next/image";
import Link from "next/link";
import { PremadeFitCard } from "@/types/premade-fit";
import { useCurrency } from "@/context/currency-context";

export function PremadeFitCardView({ fit }: { fit: PremadeFitCard }) {
  const { formatPrice } = useCurrency();
  return (
    <Link
      href={`/premade-fits/${fit.slug}`}
      className="group overflow-hidden rounded-2xl border border-white/10 bg-black/25 transition hover:border-white/25"
    >
      <div className="relative mx-auto aspect-square w-full max-w-[500px] overflow-hidden bg-black/30">
        <Image
          src={fit.image}
          alt={fit.name}
          fill
          sizes="(max-width: 640px) 90vw, (max-width: 1200px) 45vw, 500px"
          className="object-contain p-4 transition duration-300 group-hover:scale-[1.02]"
        />
      </div>
      <div className="space-y-2 p-4">
        <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">Premade Fit</p>
        <h3 className="text-lg font-semibold text-zinc-100">{fit.name}</h3>
        <p className="line-clamp-2 text-sm text-zinc-400">{fit.description}</p>
        {fit.savingsAUD > 0 ? (
          <p className="rounded-lg border border-emerald-500/35 bg-emerald-950/50 px-3 py-2 text-sm font-semibold leading-snug text-emerald-100">
            Buy this bundle · save {formatPrice(fit.savingsAUD)} vs buying all {fit.itemCount} items separately
          </p>
        ) : (
          <p className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-zinc-400">
            Bundle checkout · one price for the full outfit
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="text-zinc-300">{fit.itemCount} items</span>
          <div className="text-right">
            <span className="font-semibold text-zinc-100">{formatPrice(fit.bundlePriceAUD)}</span>
            {fit.savingsAUD > 0 ? (
              <span className="ml-2 text-zinc-500 line-through">{formatPrice(fit.retailSumAUD)}</span>
            ) : null}
          </div>
        </div>
        {fit.savingsAUD > 0 ? (
          <p className="text-xs text-emerald-300/90">You keep the discount when you add this fit to cart.</p>
        ) : null}
      </div>
    </Link>
  );
}
