import type { Metadata } from "next";
import { CategoryPageContent } from "@/components/category-page-content";
import { listProductsForCards } from "@/lib/store-db";

export const metadata: Metadata = {
  title: "Hoodies Australia | StreetVault",
  description: "Shop premium hoodies in Australia with elevated streetwear fits.",
  alternates: { canonical: "/hoodies" },
};

export default function HoodiesPage() {
  const products = listProductsForCards().filter((product) => product.category === "hoodie");

  return (
    <CategoryPageContent
      title="Hoodies"
      subtitle="Heavyweight fleece, matte finishes, and premium drape for high-end street layering."
      products={products}
    />
  );
}
