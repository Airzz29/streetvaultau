import { listProductsForCards } from "@/lib/store-db";
import { ShopClient } from "@/components/shop-client";

export default function ShopPage() {
  const products = listProductsForCards();
  return <ShopClient initialProducts={products} />;
}
