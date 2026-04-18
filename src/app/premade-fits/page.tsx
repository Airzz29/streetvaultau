import type { Metadata } from "next";
import { listPremadeFitCards } from "@/lib/store-db";
import { PremadeFitCardView } from "@/components/premade-fit-card";
import { BackNavButton } from "@/components/back-nav-button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Premade Fits | Streetwear Bundles Australia | StreetVault",
  description:
    "Shop premium premade fit bundles at StreetVault. Build complete streetwear looks with selectable sizes and colors in one checkout.",
  alternates: { canonical: "/premade-fits" },
  openGraph: {
    title: "Premade Fits | StreetVault",
    description: "Premium streetwear bundles with full variant support.",
    url: "/premade-fits",
    type: "website",
  },
};

export default function PremadeFitsPage() {
  const fits = listPremadeFitCards();

  return (
    <section className="space-y-6">
      <BackNavButton fallbackHref="/" label="Back" />
      <div className="rounded-2xl border border-white/15 bg-white/[0.05] p-5 backdrop-blur-xl sm:p-6">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Premade Fits</h1>
        <p className="mt-3 max-w-2xl text-sm text-zinc-300">
          Premium outfit bundles built from real StreetVault products. Select fit variants and add the full look in one step.
        </p>
      </div>
      {fits.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {fits.map((fit) => (
            <PremadeFitCardView key={fit.id} fit={fit} />
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-white/10 bg-black/25 p-5 text-sm text-zinc-300">
          No premade fits are live yet.
        </p>
      )}
    </section>
  );
}
