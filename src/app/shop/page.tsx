import type { Metadata } from "next";
import { listProductsForCards } from "@/lib/store-db";
import { ShopClient } from "@/components/shop-client";

export const metadata: Metadata = {
  title: "Shop Streetwear Australia | StreetVault",
  description:
    "Shop premium StreetVault streetwear including hoodies, shirts, jeans, shoes, accessories, and premade fit bundles.",
  alternates: { canonical: "/shop" },
};

export default function ShopPage() {
  const products = listProductsForCards();
  return <ShopClient initialProducts={products} />;
}
