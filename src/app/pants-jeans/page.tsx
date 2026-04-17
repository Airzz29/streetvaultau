import type { Metadata } from "next";
import { CategoryPageContent } from "@/components/category-page-content";
import { listProductsForCards } from "@/lib/store-db";

export const metadata: Metadata = {
  title: "Jeans and Pants Australia | StreetVault",
  description: "Shop premium cargo pants and jeans in Australia from StreetVault.",
  alternates: { canonical: "/pants-jeans" },
};

export default function PantsJeansPage() {
  const products = listProductsForCards().filter((product) => product.category === "pants");

  return (
    <CategoryPageContent
      title="Jeans / Pants"
      subtitle="Tapered cargos and clean utility fits with modern tailoring and premium texture."
      products={products}
    />
  );
}
