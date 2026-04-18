import type { FulfillmentType } from "@/lib/fulfillment";
import { ProductColorImageGroup, ProductVariant } from "@/types/product";

export type PremadeFitSelectionMode = "fixed" | "selectable";
export type PremadeFitItemSlot = "top" | "hoodie" | "pants" | "shoes" | "accessory";

export type PremadeFitItem = {
  id: string;
  fitId: string;
  slot: PremadeFitItemSlot;
  isOptional: boolean;
  productId: string;
  productSlug: string;
  productName: string;
  productDescription: string;
  productMainImage: string;
  itemMainImage: string | null;
  productImages: string[];
  productColorImageGroups: ProductColorImageGroup[];
  shippingRateAUD: number;
  productFulfillmentType: FulfillmentType;
  productAllowDropshipFallback: boolean;
  selectionMode: PremadeFitSelectionMode;
  allowedColors: string[];
  allowedSizes: string[];
  defaultVariantId: string | null;
  sortOrder: number;
  variants: ProductVariant[];
};

export type PremadeFit = {
  id: string;
  slug: string;
  name: string;
  description: string;
  coverImage: string;
  galleryImages: string[];
  /** Optional bundle total in AUD — when set, cheaper than summed item prices (proportional split in cart). */
  bundlePriceAUD: number | null;
  active: boolean;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  items: PremadeFitItem[];
};

export type PremadeFitCard = {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string;
  itemCount: number;
  /** Display price (bundle override or sum of minimums). */
  bundlePriceAUD: number;
  /** Sum of cheapest variant per line item (compare-at retail). */
  retailSumAUD: number;
  savingsAUD: number;
  compareAtPriceAUD: number | null;
  totalStock: number;
};
