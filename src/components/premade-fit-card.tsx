"use client";

import Image from "next/image";
import Link from "next/link";
import { PremadeFitCard } from "@/types/premade-fit";
import { formatPriceAUD } from "@/lib/utils";

export function PremadeFitCardView({ fit }: { fit: PremadeFitCard }) {
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
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-300">{fit.itemCount} items</span>
          <span className="font-semibold text-zinc-100">{formatPriceAUD(fit.minPriceAUD)}</span>
        </div>
      </div>
    </Link>
  );
}
