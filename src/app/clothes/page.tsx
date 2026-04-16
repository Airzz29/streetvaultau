import { CategoryPageContent } from "@/components/category-page-content";
import { listProductsForCards } from "@/lib/store-db";

export default function ClothesPage() {
  const products = listProductsForCards().filter((product) =>
    ["tee", "hoodie", "pants"].includes(product.category)
  );

  return (
    <CategoryPageContent
      title="Clothes"
      subtitle="Premium cut tees, hoodies, and essentials for clean street silhouettes."
      products={products}
    />
  );
}
