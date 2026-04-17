import type { Metadata } from "next";
import { CategoryPageContent } from "@/components/category-page-content";
import { listProductsForCards } from "@/lib/store-db";

export const metadata: Metadata = {
  title: "Streetwear Shoes Australia | StreetVault",
  description: "Shop premium streetwear shoes and runners in Australia.",
  alternates: { canonical: "/shoes" },
};

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
