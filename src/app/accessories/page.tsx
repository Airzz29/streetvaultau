import type { Metadata } from "next";
import { CategoryPageContent } from "@/components/category-page-content";
import { listProductsForCards } from "@/lib/store-db";

export const metadata: Metadata = {
  title: "Streetwear Accessories Australia | StreetVault",
  description: "Premium accessories to complete your outfit stack.",
  alternates: { canonical: "/accessories" },
};

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
