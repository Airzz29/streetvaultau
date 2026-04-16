import { ProductCardData } from "@/types/product";
import { ProductCard } from "@/components/product-card";

type FeaturedProductsProps = {
  title: string;
  subtitle: string;
  products: ProductCardData[];
};

export function FeaturedProducts({ title, subtitle, products }: FeaturedProductsProps) {
  return (
    <section className="space-y-5">
      <div className="flex items-end justify-between">
        <h2 className="text-2xl font-semibold">{title}</h2>
        <p className="text-sm text-zinc-400">{subtitle}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
