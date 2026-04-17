import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPremadeFitBySlug, listPremadeFitCards } from "@/lib/store-db";
import { PremadeFitDetailExperience } from "@/components/premade-fit-detail-experience";

type PremadeFitDetailPageProps = {
  params: { slug: string };
};

export function generateMetadata({ params }: PremadeFitDetailPageProps): Metadata {
  const fit = getPremadeFitBySlug(params.slug);
  if (!fit) {
    return {
      title: "Premade Fit | StreetVault",
      description: "Premium streetwear bundle from StreetVault.",
    };
  }
  return {
    title: `${fit.name} | Premade Fit Bundle | StreetVault`,
    description: fit.description.slice(0, 160),
    alternates: { canonical: `/premade-fits/${fit.slug}` },
    openGraph: {
      title: `${fit.name} | StreetVault`,
      description: fit.description.slice(0, 160),
      url: `/premade-fits/${fit.slug}`,
      images: fit.coverImage ? [{ url: fit.coverImage }] : undefined,
      type: "website",
    },
  };
}

export default function PremadeFitDetailPage({ params }: PremadeFitDetailPageProps) {
  const fit = getPremadeFitBySlug(params.slug);
  if (!fit) notFound();
  const relatedFits = listPremadeFitCards()
    .filter((entry) => entry.id !== fit.id)
    .slice(0, 4);

  const minPrice = fit.items.reduce((sum, item) => {
    const minItem = item.variants.length ? Math.min(...item.variants.map((variant) => variant.price)) : 0;
    return sum + minItem;
  }, 0);

  const bundleSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: fit.name,
    description: fit.description,
    image: [fit.coverImage, ...fit.galleryImages].filter(Boolean),
    category: "Streetwear Bundle",
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "AUD",
      lowPrice: minPrice.toFixed(2),
      offerCount: fit.items.length,
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(bundleSchema) }} />
      <PremadeFitDetailExperience fit={fit} relatedFits={relatedFits} />
    </>
  );
}
