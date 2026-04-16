import { CategoryPageContent } from "@/components/category-page-content";
import { listProductsForCards } from "@/lib/store-db";

export default function AccessoriesPage() {
  const products = listProductsForCards().filter((product) =>
    ["cap", "accessory"].includes(product.category)
  );

  return (
    <CategoryPageContent
      title="Accessories"
      subtitle="Elevated finishing pieces designed to complete your full outfit stack."
      products={products}
    />
  );
}
