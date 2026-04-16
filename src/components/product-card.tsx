import Image from "next/image";
import Link from "next/link";
import { ProductCardData } from "@/types/product";
import { formatPriceAUD } from "@/lib/utils";
import { GlassCard } from "@/components/glass-card";

type ProductCardProps = {
  product: ProductCardData;
};

export function ProductCard({ product }: ProductCardProps) {
  const lowStock = product.lowestStock > 0 && product.lowestStock <= 3;
  const outOfStock = product.totalStock <= 0;

  const visualImage = product.builderImage ?? product.image;

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
            {formatPriceAUD(product.basePrice)}
          </span>
          {product.compareAtPrice ? (
            <span className="text-zinc-500 line-through">
              {formatPriceAUD(product.compareAtPrice)}
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
      </div>
    </GlassCard>
  );
}
