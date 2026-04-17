"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PremadeFit, PremadeFitCard } from "@/types/premade-fit";
import { useCart } from "@/context/cart-context";
import { formatPriceAUD } from "@/lib/utils";
import { BackNavButton } from "@/components/back-nav-button";
import { PremadeFitCardView } from "@/components/premade-fit-card";

function resolveColorImages(
  product: { productMainImage: string; productImages: string[]; productColorImageGroups: PremadeFit["items"][number]["productColorImageGroups"] },
  color: string
) {
  const group = product.productColorImageGroups.find(
    (entry) => entry.color.trim().toLowerCase() === color.trim().toLowerCase()
  );
  const main = group?.mainImage ?? product.productMainImage ?? product.productImages[0];
  const gallery = group?.galleryImages?.length ? group.galleryImages : product.productImages;
  const merged = Array.from(new Set([main, ...gallery].filter(Boolean)));
  return { mainImage: merged[0] ?? product.productMainImage, galleryImages: merged };
}

export function PremadeFitDetailExperience({
  fit,
  relatedFits,
}: {
  fit: PremadeFit;
  relatedFits: PremadeFitCard[];
}) {
  const router = useRouter();
  const { addItems } = useCart();
  const [activeImage, setActiveImage] = useState(fit.coverImage || fit.galleryImages[0]);
  const [selection, setSelection] = useState<Record<string, { color: string; variantId: string }>>(() => {
    const seed: Record<string, { color: string; variantId: string }> = {};
    for (const item of fit.items) {
      const defaultVariant =
        item.variants.find((variant) => variant.id === item.defaultVariantId) ??
        item.variants.find((variant) => variant.stock > 0) ??
        item.variants[0];
      if (!defaultVariant) continue;
      seed[item.id] = { color: defaultVariant.color, variantId: defaultVariant.id };
    }
    return seed;
  });
  const [includedOptional, setIncludedOptional] = useState<Record<string, boolean>>(() => {
    const seed: Record<string, boolean> = {};
    for (const item of fit.items) {
      seed[item.id] = item.isOptional ? true : true;
    }
    return seed;
  });

  const selectedVariants = useMemo(
    () =>
      fit.items.map((item) => {
        const included = item.isOptional ? includedOptional[item.id] !== false : true;
        const chosen = selection[item.id];
        const variant =
          item.variants.find((entry) => entry.id === chosen?.variantId) ??
          item.variants.find((entry) => entry.id === item.defaultVariantId) ??
          item.variants[0];
        return { item, included, variant: included ? (variant ?? null) : null };
      }),
    [fit.items, includedOptional, selection]
  );

  const includedRows = selectedVariants.filter((row) => row.included);
  const bundlePrice = includedRows.reduce((sum, row) => sum + (row.variant?.price ?? 0), 0);
  const bundleCompareAt = includedRows.reduce((sum, row) => {
    const item = row.item;
    const maxPrice = item.variants.length ? Math.max(...item.variants.map((variant) => variant.price)) : 0;
    return sum + maxPrice;
  }, 0);
  const bundleSavings = Math.max(0, bundleCompareAt - bundlePrice);
  const soldOut = includedRows.some((row) => !row.variant || row.variant.stock <= 0);

  const ensureLoggedIn = async () => {
    const response = await fetch("/api/auth/me", { cache: "no-store" });
    const data = await response.json();
    if (!data?.user) {
      const next = encodeURIComponent(window.location.pathname);
      router.push(`/login?next=${next}&reason=add_to_cart`);
      return false;
    }
    return true;
  };

  const addFitToCart = async (goCheckout: boolean) => {
    if (!(await ensureLoggedIn())) return;
    if (soldOut) return;
    const bundleId = `fit-${crypto.randomUUID()}`;
    const items = includedRows
      .filter((row): row is typeof row & { variant: NonNullable<typeof row.variant> } => Boolean(row.variant))
      .map((row) => {
        const colorImage = resolveColorImages(row.item, row.variant.color).mainImage;
        return {
          bundleId,
          bundleName: fit.name,
          productId: row.item.productId,
          variantId: row.variant.id,
          size: row.variant.size,
          color: row.variant.color,
          name: row.item.productName,
          image: row.item.itemMainImage ?? colorImage,
          unitPrice: row.variant.price,
          shippingRateAUD: row.item.shippingRateAUD,
          quantity: 1,
        };
      });
    addItems(items);
    if (goCheckout) router.push("/checkout");
  };

  return (
    <section className="space-y-7">
      <BackNavButton fallbackHref="/premade-fits" label="Back" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="relative mx-auto aspect-square w-full max-w-[500px] overflow-hidden rounded-2xl border border-white/10 bg-black/30">
            <Image src={activeImage} alt={fit.name} fill sizes="(max-width: 768px) 92vw, 500px" className="object-contain p-4" />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[fit.coverImage, ...fit.galleryImages].filter(Boolean).slice(0, 8).map((image) => (
              <button
                key={image}
                type="button"
                onClick={() => setActiveImage(image)}
                className={`relative h-20 overflow-hidden rounded-lg border ${activeImage === image ? "border-zinc-100" : "border-white/15"}`}
              >
                <Image src={image} alt={fit.name} fill sizes="120px" className="object-contain p-1.5" />
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Premade Fit Bundle</p>
          <h1 className="text-3xl font-semibold">{fit.name}</h1>
          <p className="text-zinc-300">{fit.description}</p>
          <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
            <div className="flex items-center gap-3">
              <p className="text-2xl font-semibold">{formatPriceAUD(bundlePrice)}</p>
              {bundleCompareAt > bundlePrice ? (
                <p className="text-zinc-500 line-through">{formatPriceAUD(bundleCompareAt)}</p>
              ) : null}
            </div>
            {bundleSavings > 0 ? (
              <p className="mt-1 text-sm text-emerald-300">Bundle savings: {formatPriceAUD(bundleSavings)}</p>
            ) : null}
            <p className="mt-2 text-sm text-zinc-400">Includes {fit.items.length} real products.</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => void addFitToCart(false)}
              disabled={soldOut}
              className="rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {soldOut ? "Unavailable" : "Add Fit To Cart"}
            </button>
            <button
              type="button"
              onClick={() => void addFitToCart(true)}
              disabled={soldOut}
              className="rounded-xl bg-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-900 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {soldOut ? "Unavailable" : "Buy This Fit"}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Included Items</h2>
        <div className="space-y-4">
          {selectedVariants.map(({ item, variant, included }) => {
            const selectedColor = selection[item.id]?.color ?? variant?.color ?? "";
            const colorImages = resolveColorImages(item, selectedColor);
            const sizeOptions = item.selectionMode === "fixed"
              ? (variant ? [variant] : [])
              : item.variants.filter((entry) => entry.color === selectedColor);
            const colorOptions = item.selectionMode === "fixed"
              ? (variant ? [variant.color] : [])
              : Array.from(new Set(item.variants.map((entry) => entry.color)));
            return (
              <article key={item.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="grid gap-4 md:grid-cols-[120px_1fr]">
                  <div className="relative h-28 overflow-hidden rounded-xl border border-white/10 bg-black/30">
                    <Image
                      src={item.itemMainImage ?? colorImages.mainImage}
                      alt={item.productName}
                      fill
                      sizes="120px"
                      className="object-contain p-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Link href={`/product/${item.productSlug}`} className="text-lg font-semibold hover:underline">
                      {item.productName}
                    </Link>
                    {item.isOptional ? (
                      <label className="inline-flex items-center gap-2 rounded border border-white/20 px-2 py-1 text-xs text-zinc-300">
                        <input
                          type="checkbox"
                          checked={included}
                          onChange={(event) =>
                            setIncludedOptional((prev) => ({ ...prev, [item.id]: event.target.checked }))
                          }
                        />
                        Include this optional item
                      </label>
                    ) : null}
                    {!included ? (
                      <p className="text-sm text-zinc-500">Skipped by customer.</p>
                    ) : null}
                    {included && item.selectionMode === "fixed" ? (
                      <p className="text-sm text-zinc-400">
                        Fixed selection: {variant?.color} / {variant?.size}
                      </p>
                    ) : included ? (
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {colorOptions.map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => {
                                const nextVariant =
                                  item.variants.find((entry) => entry.color === color && entry.stock > 0) ??
                                  item.variants.find((entry) => entry.color === color);
                                if (!nextVariant) return;
                                setSelection((prev) => ({
                                  ...prev,
                                  [item.id]: { color, variantId: nextVariant.id },
                                }));
                              }}
                              className={`rounded-lg border px-3 py-1.5 text-xs ${
                                selectedColor === color
                                  ? "border-zinc-100 bg-zinc-100 text-zinc-900"
                                  : "border-white/20 text-zinc-200"
                              }`}
                            >
                              {color}
                            </button>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {sizeOptions.map((entry) => (
                            <button
                              key={entry.id}
                              type="button"
                              disabled={entry.stock <= 0}
                              onClick={() =>
                                setSelection((prev) => ({
                                  ...prev,
                                  [item.id]: { color: entry.color, variantId: entry.id },
                                }))
                              }
                              className={`rounded-lg border px-3 py-1.5 text-xs ${
                                variant?.id === entry.id
                                  ? "border-zinc-100 bg-zinc-100 text-zinc-900"
                                  : "border-white/20 text-zinc-200"
                              } disabled:cursor-not-allowed disabled:opacity-40`}
                            >
                              {entry.size}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    <p className="text-sm text-zinc-300">
                      {variant ? formatPriceAUD(variant.price) : "Unavailable"}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {relatedFits.length ? (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Related Premade Fits</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {relatedFits.map((entry) => (
              <PremadeFitCardView key={entry.id} fit={entry} />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
