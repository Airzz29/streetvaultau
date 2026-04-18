import type { Metadata } from "next";
import { CategoryPageContent } from "@/components/category-page-content";
import { listProductsForCards } from "@/lib/store-db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shirts Australia | StreetVault",
  description: "Shop premium streetwear shirts in Australia from StreetVault.",
  alternates: { canonical: "/clothes" },
};

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
