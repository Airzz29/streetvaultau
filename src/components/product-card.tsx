"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { ProductCardData } from "@/types/product";
import { useCurrency } from "@/context/currency-context";
import { GlassCard } from "@/components/glass-card";

type ProductCardProps = {
  product: ProductCardData;
};

export function ProductCard({ product }: ProductCardProps) {
  const { formatPrice } = useCurrency();
  const lowStock = product.lowestStock > 0 && product.lowestStock <= 3;
  const outOfStock = product.totalStock <= 0;
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  const colorScrollerRef = useRef<HTMLDivElement | null>(null);
  const sizeScrollerRef = useRef<HTMLDivElement | null>(null);

  const visualImage = product.builderImage ?? product.image;
  const colorPreview = product.availableColors.slice(0, 24);
  const sizePreview = product.availableSizes.slice(0, 16);

  const scrollByAmount = (target: HTMLDivElement | null, direction: "left" | "right") => {
    if (!target) return;
    target.scrollBy({ left: direction === "left" ? -130 : 130, behavior: "smooth" });
  };

  return (
    <GlassCard className="group anim-float-in overflow-hidden transition duration-300 hover:-translate-y-1 hover:border-zinc-500">
      <Link href={`/product/${product.slug}`}>
        <div className="relative h-56 w-full overflow-hidden bg-gradient-to-b from-black/30 to-black/65 sm:h-64 lg:h-72">
          <Image
            src={visualImage}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-contain p-4 transition duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-x-0 top-0 flex justify-between p-2.5 text-xs sm:p-3">
            <span className="rounded-full border border-zinc-700 bg-black/70 px-2 py-1 uppercase tracking-wider text-zinc-200">
              {product.category}
            </span>
            {outOfStock ? (
              <span className="rounded-full border border-red-500/40 bg-red-950/80 px-2 py-1 text-red-200">
                Out of Stock
              </span>
            ) : null}
            {!outOfStock && lowStock ? (
              <span className="rounded-full border border-amber-500/40 bg-amber-950/80 px-2 py-1 text-amber-200">
                Low Stock
              </span>
            ) : null}
          </div>
        </div>
      </Link>
      <div className="space-y-2 p-4">
        <Link href={`/product/${product.slug}`} className="line-clamp-1 text-base font-semibold sm:text-lg">
          {product.name}
        </Link>
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-zinc-100">
            {formatPrice(product.basePrice)}
          </span>
          {product.compareAtPrice ? (
            <span className="text-zinc-500 line-through">
              {formatPrice(product.compareAtPrice)}
            </span>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Link
            href={`/product/${product.slug}`}
            className="rounded-lg border border-white/15 px-3 py-2.5 text-center text-sm font-semibold text-zinc-100 hover:bg-white/10"
          >
            View Details
          </Link>
          <Link
            href={`/product/${product.slug}`}
            className="rounded-lg bg-white px-3 py-2.5 text-center text-sm font-semibold text-zinc-900 hover:bg-zinc-100"
          >
            Get It
          </Link>
        </div>
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setMobilePreviewOpen((prev) => !prev)}
            className="min-h-10 w-full rounded-lg border border-white/15 px-3 text-xs font-semibold text-zinc-200 hover:bg-white/10 sm:hidden"
          >
            {mobilePreviewOpen ? "Hide Variants" : "View Variants"}
          </button>
          <div
            className={`mt-2 space-y-2 rounded-lg border border-white/10 bg-black/25 p-2 ${
              mobilePreviewOpen ? "block" : "hidden"
            } sm:block sm:max-h-0 sm:overflow-hidden sm:border-0 sm:bg-transparent sm:p-0 sm:opacity-0 sm:transition-all sm:duration-200 sm:group-hover:max-h-40 sm:group-hover:opacity-100`}
          >
            <div>
              <p className="mb-1 text-[11px] uppercase tracking-[0.14em] text-zinc-400">Colors</p>
              <div className="flex items-center gap-1.5">
                {colorPreview.length > 5 ? (
                  <button
                    type="button"
                    onClick={() => scrollByAmount(colorScrollerRef.current, "left")}
                    className="hidden rounded border border-white/20 px-1.5 py-1 text-[10px] sm:inline-flex"
                  >
                    {"<"}
                  </button>
                ) : null}
                <div ref={colorScrollerRef} className="flex gap-1.5 overflow-x-auto whitespace-nowrap [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {colorPreview.length ? (
                    colorPreview.map((color) => (
                      <span key={`${product.id}-${color}`} className="rounded border border-white/20 px-2 py-1 text-[11px] text-zinc-200">
                        {color}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-zinc-500">No in-stock colors</span>
                  )}
                </div>
                {colorPreview.length > 5 ? (
                  <button
                    type="button"
                    onClick={() => scrollByAmount(colorScrollerRef.current, "right")}
                    className="hidden rounded border border-white/20 px-1.5 py-1 text-[10px] sm:inline-flex"
                  >
                    {">"}
                  </button>
                ) : null}
              </div>
            </div>
            <div>
              <p className="mb-1 text-[11px] uppercase tracking-[0.14em] text-zinc-400">Sizes</p>
              <div className="flex items-center gap-1.5">
                {sizePreview.length > 6 ? (
                  <button
                    type="button"
                    onClick={() => scrollByAmount(sizeScrollerRef.current, "left")}
                    className="hidden rounded border border-white/20 px-1.5 py-1 text-[10px] sm:inline-flex"
                  >
                    {"<"}
                  </button>
                ) : null}
                <div ref={sizeScrollerRef} className="flex gap-1.5 overflow-x-auto whitespace-nowrap [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {sizePreview.length ? (
                    sizePreview.map((size) => (
                      <span key={`${product.id}-${size}`} className="rounded border border-white/20 px-2 py-1 text-[11px] text-zinc-200">
                        {size}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-zinc-500">No in-stock sizes</span>
                  )}
                </div>
                {sizePreview.length > 6 ? (
                  <button
                    type="button"
                    onClick={() => scrollByAmount(sizeScrollerRef.current, "right")}
                    className="hidden rounded border border-white/20 px-1.5 py-1 text-[10px] sm:inline-flex"
                  >
                    {">"}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
