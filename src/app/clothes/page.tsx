import { CategoryPageContent } from "@/components/category-page-content";
import { listProductsForCards } from "@/lib/store-db";

export default function ClothesPage() {
  const products = listProductsForCards().filter((product) => product.category === "tee");

  return (
    <CategoryPageContent
      title="Shirts"
      subtitle="Premium shirt silhouettes with clean cuts, elevated fabric, and everyday streetwear comfort."
      products={products}
    />
  );
}
