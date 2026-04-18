"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { ProductCardData, ProductWithVariants } from "@/types/product";
import { ProductPurchasePanel } from "@/components/product-purchase-panel";
import { ProductCard } from "@/components/product-card";
import { useCurrency } from "@/context/currency-context";
import { GlassCard } from "@/components/glass-card";
import { ProductReview } from "@/types/review";
import { ReviewCard } from "@/components/review-card";
import Link from "next/link";
import { BackNavButton } from "@/components/back-nav-button";

type ProductDetailExperienceProps = {
  product: ProductWithVariants;
  relatedProducts: ProductCardData[];
  reviews: ProductReview[];
  hasMoreReviews: boolean;
};

function getVariantKey(color: string, size: string) {
  return `${color.trim().toLowerCase()}::${size.trim().toLowerCase()}`;
}

function resolveColorImages(product: ProductWithVariants, color: string) {
  const group = (product.colorImageGroups ?? []).find(
    (entry) => entry.color.trim().toLowerCase() === color.trim().toLowerCase()
  );
  const main = group?.mainImage ?? product.mainImage ?? product.images[0];
  const gallery = group
    ? group.galleryImages?.length
      ? group.galleryImages
      : [main]
    : product.images;
  const merged = Array.from(new Set([main, ...gallery].filter(Boolean)));
  return { mainImage: merged[0] ?? product.images[0], galleryImages: merged };
}

export function ProductDetailExperience({
  product,
  relatedProducts,
  reviews,
  hasMoreReviews,
}: ProductDetailExperienceProps) {
  const { formatPrice } = useCurrency();
  const defaultVariant =
    product.variants.find(
      (variant) =>
        product.defaultVariantKey &&
        getVariantKey(variant.color, variant.size) === product.defaultVariantKey
    ) ??
    product.variants.find((variant) => variant.stock > 0) ??
    product.variants[0];
  const defaultColor = defaultVariant?.color ?? "";
  const [selectedColor, setSelectedColor] = useState(defaultColor);

  const imagesForColor = useMemo(
    () => resolveColorImages(product, selectedColor),
    [product, selectedColor]
  );
  const [selectedImage, setSelectedImage] = useState(imagesForColor.mainImage);

  const startingPrice = Math.min(...product.variants.map((variant) => variant.price));

  return (
    <section className="space-y-8 fade-slide-up sm:space-y-10">
      <BackNavButton fallbackHref="/shop" label="Back" />
      <div className="grid gap-5 sm:gap-6 lg:grid-cols-2 lg:gap-8">
        <div className="grid gap-3">
          <GlassCard className="relative min-h-[340px] overflow-hidden sm:min-h-[460px]">
            <Image
              src={selectedImage}
              alt={`${product.name} ${selectedColor}`.trim()}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-contain p-6 transition-opacity duration-200"
              priority
            />
          </GlassCard>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            {imagesForColor.galleryImages.slice(0, 8).map((image) => (
              <button
                key={image}
                type="button"
                onClick={() => setSelectedImage(image)}
                className={`rounded-xl border p-1 ${selectedImage === image ? "border-zinc-100" : "border-white/10"}`}
              >
                <div className="relative min-h-24 overflow-hidden rounded-lg">
                  <Image src={image} alt={product.name} fill sizes="160px" className="object-contain p-2" />
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4 sm:space-y-5">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">{product.category}</p>
          <h1 className="text-2xl font-semibold sm:text-4xl">{product.name}</h1>
          <div className="flex items-center gap-3">
            <p className="text-2xl font-semibold">{formatPrice(startingPrice)}</p>
            {product.compareAtPrice ? (
              <p className="text-zinc-500 line-through">{formatPrice(product.compareAtPrice)}</p>
            ) : null}
          </div>
          <p className="text-zinc-300">{product.description}</p>
          <ProductPurchasePanel
            product={product}
            selectedColor={selectedColor}
            onColorChange={(color) => {
              setSelectedColor(color);
              const updated = resolveColorImages(product, color);
              setSelectedImage(updated.mainImage);
            }}
          />
          <div className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-sm text-zinc-400">
            <p>1-3 day express shipping in Australia only</p>
            <p>Returns accepted within 14 days</p>
            <p>Secure checkout powered by Stripe</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Related Products</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {relatedProducts.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-2xl font-semibold">Customer Reviews</h2>
          {hasMoreReviews ? (
            <Link
              href={`/reviews?productId=${encodeURIComponent(product.id)}`}
              className="text-sm text-zinc-300 hover:text-zinc-100"
            >
              View More Reviews
            </Link>
          ) : null}
        </div>
        {reviews.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-400">
            No reviews yet for this product.
          </p>
        )}
      </div>
    </section>
  );
}

