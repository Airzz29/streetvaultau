import Link from "next/link";
import { OutfitBuilderExperience } from "@/components/outfit-builder-experience";
import { listProductsWithVariants } from "@/lib/store-db";

export const dynamic = "force-dynamic";

export default function OutfitBuilderPage() {
  const products = listProductsWithVariants();
  return (
    <section className="space-y-4">
      <div className="flex flex-col items-end gap-1">
        <Link
          href="/premade-fits"
          className="rounded-xl border border-emerald-300/40 bg-emerald-500/15 px-4 py-2.5 text-sm font-semibold text-emerald-100 hover:bg-emerald-500/25"
        >
          Browse Premade Fits (save more)
        </Link>
        <p className="text-[11px] text-zinc-500">Bundle pricing vs buying items individually.</p>
      </div>
      <OutfitBuilderExperience products={products} />
    </section>
  );
}
