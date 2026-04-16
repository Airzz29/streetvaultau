import { OutfitBuilderExperience } from "@/components/outfit-builder-experience";
import { listProductsWithVariants } from "@/lib/store-db";

export default function OutfitBuilderPage() {
  const products = listProductsWithVariants();
  return <OutfitBuilderExperience products={products} />;
}
