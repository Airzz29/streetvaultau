import type { Metadata } from "next";
import Link from "next/link";
import { listPremadeFitCards, listProductsForCards, listProductsWithVariants } from "@/lib/store-db";
import { ProductCard } from "@/components/product-card";
import { OutfitBuilderExperience } from "@/components/outfit-builder-experience";
import { GlassCard } from "@/components/glass-card";
import { CategoryNav } from "@/components/category-nav";
import { listApprovedReviews } from "@/lib/store-db";
import { ReviewCard } from "@/components/review-card";
import { PremadeFitCardView } from "@/components/premade-fit-card";

export const metadata: Metadata = {
  title: "Streetwear Australia | Premium Fits | StreetVault",
  description:
    "StreetVault is a premium streetwear store in Australia for hoodies, cargos, shoes, and premade outfit bundles.",
  alternates: { canonical: "/" },
  keywords: [
    "streetwear australia",
    "hoodies australia",
    "cargo pants australia",
    "premium streetwear bundles",
    "outfit bundles australia",
    "chrome style streetwear",
  ],
};

export default function Home() {
  const products = listProductsForCards();
  const richProducts = listProductsWithVariants();
  /** Same source as admin catalog: newest active products with variants (`listProductsForCards` orders by `created_at`). */
  const topSellers = products.slice(0, 6);
  const featuredFits = listPremadeFitCards().slice(0, 3);
  const latestReviews = listApprovedReviews(5);

  return (
    <div className="space-y-8 sm:space-y-12">
      <section className="relative min-h-[54vh] sm:min-h-[60vh] fade-slide-up">
        <div className="relative z-10 flex min-h-[54vh] items-start justify-center p-2 pt-4 sm:min-h-[60vh] sm:p-8 sm:pt-8">
          <GlassCard className="w-full max-w-4xl p-5 sm:p-8">
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-300">
              Cinematic Premium Streetwear
            </p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-6xl">
              Built for Elevated Daily Fits.
            </h1>
            <p className="mt-4 text-sm text-zinc-300 sm:text-base">
              StreetVault brings the best quality clothes and shoes with 1-3 day express
              shipping in Australia only.
            </p>
            <div className="mt-4">
              <CategoryNav compact />
            </div>
            <div className="mt-4 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-4">
              <Link
                href="/clothes"
                className="w-full rounded-xl bg-zinc-100 px-5 py-3 text-center text-sm font-semibold text-zinc-950 hover:bg-white sm:min-w-40 sm:w-auto"
              >
                Shop Now
              </Link>
              <Link
                href="/outfit-builder"
                className="w-full rounded-xl border border-white/25 px-5 py-3 text-center text-sm font-semibold text-zinc-100 hover:bg-white/10 sm:min-w-40 sm:w-auto"
              >
                Start Outfit Builder
              </Link>
            </div>
          </GlassCard>
        </div>
      </section>

      <section className="space-y-4 -mt-8 sm:-mt-20 fade-slide-up">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-semibold sm:text-3xl">Top Sellers</h2>
          <Link href="/clothes" className="text-sm text-zinc-300 hover:text-zinc-100">
            View all
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topSellers.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="space-y-4 fade-slide-up">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-semibold sm:text-3xl">Premade Fits</h2>
          <Link href="/premade-fits" className="text-sm text-zinc-300 hover:text-zinc-100">
            View all fits
          </Link>
        </div>
        {featuredFits.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredFits.map((fit) => (
              <PremadeFitCardView key={fit.id} fit={fit} />
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-400">
            Premade fits are coming soon.
          </p>
        )}
      </section>

      <section className="space-y-4 fade-slide-up">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold sm:text-3xl">Build Your Fit</h2>
            <p className="mt-1 text-sm text-zinc-400">Save more when you buy full outfits — premade fits include bundle pricing.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/premade-fits"
              className="rounded-xl border border-emerald-300/40 bg-emerald-500/15 px-4 py-2.5 text-sm font-semibold text-emerald-100 hover:bg-emerald-500/25"
            >
              Shop Premade Fits
            </Link>
            <Link href="/outfit-builder" className="text-sm text-zinc-300 hover:text-zinc-100">
              Full outfit builder
            </Link>
          </div>
        </div>
        <OutfitBuilderExperience products={richProducts} compact />
        <p className="text-xs text-zinc-400">Express shipping: Australia only (1-3 days).</p>
      </section>

      <section className="space-y-4 fade-slide-up">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-semibold sm:text-3xl">Latest Reviews</h2>
          <Link href="/reviews" className="text-sm text-zinc-300 hover:text-zinc-100">
            View More Reviews
          </Link>
        </div>
        {latestReviews.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {latestReviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-400">
            Reviews will appear here after verified purchases are reviewed.
          </p>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-3 fade-slide-up">
        <div className="rounded-2xl bg-white/[0.03] p-5 backdrop-blur">
          <p className="text-sm font-semibold">Express Delivery</p>
          <p className="mt-2 text-sm text-zinc-400">
            1-3 day express shipping across Australia.
          </p>
        </div>
        <div className="rounded-2xl bg-white/[0.03] p-5 backdrop-blur">
          <p className="text-sm font-semibold">Quality Guarantee</p>
          <p className="mt-2 text-sm text-zinc-400">Premium fabrics and strict QC standards.</p>
        </div>
        <div className="rounded-2xl bg-white/[0.03] p-5 backdrop-blur">
          <p className="text-sm font-semibold">Australia Only</p>
          <p className="mt-2 text-sm text-zinc-400">
            Shipping and fulfillment currently available only in Australia.
          </p>
        </div>
      </section>
      <section className="rounded-2xl border border-white/10 bg-black/25 p-5 text-center backdrop-blur-xl fade-slide-up">
        <p className="text-sm text-zinc-300">Need help with sizing, shipping, or your order?</p>
        <Link
          href="/contact"
          className="mt-3 inline-flex rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-zinc-100 hover:bg-white/10"
        >
          Contact Us
        </Link>
      </section>
    </div>
  );
}
