import { CategoryPageContent } from "@/components/category-page-content";
import { listProductsForCards } from "@/lib/store-db";

export default function ShoesPage() {
  const products = listProductsForCards().filter((product) => product.category === "shoes");

  return (
    <CategoryPageContent
      title="Shoes"
      subtitle="Street-ready runners and everyday premium footwear with performance details."
      products={products}
    />
  );
}
