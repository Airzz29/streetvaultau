import { ProductCardData } from "@/types/product";
import { ProductCard } from "@/components/product-card";
import { BackNavButton } from "@/components/back-nav-button";

type CategoryPageContentProps = {
  title: string;
  subtitle: string;
  products: ProductCardData[];
};

export function CategoryPageContent({
  title,
  subtitle,
  products,
}: CategoryPageContentProps) {
  return (
    <section className="space-y-6 fade-slide-up">
      <BackNavButton fallbackHref="/" label="Back" />
      <div className="rounded-2xl border border-white/15 bg-white/[0.05] p-5 backdrop-blur-xl sm:p-6">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm text-zinc-300">{subtitle}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
