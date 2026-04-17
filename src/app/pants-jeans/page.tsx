import type { Metadata } from "next";
import { CategoryPageContent } from "@/components/category-page-content";
import { listProductsForCards } from "@/lib/store-db";

export const metadata: Metadata = {
  title: "Pants, Shorts and Jeans Australia | StreetVault",
  description: "Shop premium joggers, shorts, and jeans in Australia from StreetVault.",
  alternates: { canonical: "/pants-jeans" },
};

export default function PantsJeansPage() {
  const products = listProductsForCards().filter((product) => product.category === "pants");

  return (
    <CategoryPageContent
      title="Pants / Shorts / Jeans"
      subtitle="Baggy joggers, tailored shorts, and clean denim cuts with premium texture."
      products={products}
      enableBottomsTypeFilter
    />
  );
}
