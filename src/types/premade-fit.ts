import { ProductColorImageGroup, ProductVariant } from "@/types/product";

export type PremadeFitSelectionMode = "fixed" | "selectable";

export type PremadeFitItem = {
  id: string;
  fitId: string;
  productId: string;
  productSlug: string;
  productName: string;
  productDescription: string;
  productMainImage: string;
  itemMainImage: string | null;
  productImages: string[];
  productColorImageGroups: ProductColorImageGroup[];
  shippingRateAUD: number;
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
  minPriceAUD: number;
  compareAtPriceAUD: number | null;
  totalStock: number;
};
