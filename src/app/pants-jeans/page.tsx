import { CategoryPageContent } from "@/components/category-page-content";
import { listProductsForCards } from "@/lib/store-db";

export default function PantsJeansPage() {
  const products = listProductsForCards().filter((product) => product.category === "pants");

  return (
    <CategoryPageContent
      title="Pants / Jeans"
      subtitle="Tapered cargos and clean utility fits with modern tailoring and premium texture."
      products={products}
    />
  );
}
