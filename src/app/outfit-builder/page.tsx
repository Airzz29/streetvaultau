import Link from "next/link";
import { OutfitBuilderExperience } from "@/components/outfit-builder-experience";
import { listProductsWithVariants } from "@/lib/store-db";

export default function OutfitBuilderPage() {
  const products = listProductsWithVariants();
  return (
    <section className="space-y-4">
      <div className="flex justify-end">
        <Link
          href="/premade-fits"
          className="rounded-xl border border-emerald-300/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/20"
        >
          View Premade Fits
        </Link>
      </div>
      <OutfitBuilderExperience products={products} />
    </section>
  );
}
