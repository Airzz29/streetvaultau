export type OutfitSlot = "top" | "bottom" | "shoes" | "accessory";

export type ProductCategory =
  | "hoodie"
  | "tee"
  | "pants"
  | "cap"
  | "shoes"
  | "accessory";

export type ProductTag = "featured" | "best_seller" | "new_arrival";

export type ProductColorImageGroup = {
  color: string;
  mainImage?: string | null;
  builderImage?: string | null;
  galleryImages: string[];
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  brand?: string | null;
  collection?: string | null;
  productType?: string | null;
  category: ProductCategory;
  description: string;
  compareAtPrice?: number | null;
  costPrice: number;
  shippingRateAUD: number;
  images: string[];
  builderImage?: string | null;
  mainImage?: string;
  colorImageGroups?: ProductColorImageGroup[];
  defaultVariantKey?: string | null;
  active: boolean;
  featured: boolean;
  bestSeller: boolean;
  newArrival: boolean;
  barcode?: string | null;
  outfitSlot: OutfitSlot;
  tags: ProductTag[];
  createdAt: string;
  updatedAt: string;
};

export type ProductVariant = {
  id: string;
  productId: string;
  size: string;
  color: string;
  price: number;
  stock: number;
  sku: string;
  stockHolder?: string | null;
  stockLocation?: string | null;
  lowStockThreshold?: number | null;
  stockNotes?: string | null;
  updatedAt?: string;
};

export type ProductWithVariants = Product & {
  variants: ProductVariant[];
};

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  brand?: string | null;
  productType?: string | null;
  image: string;
  builderImage?: string | null;
  category: ProductCategory;
  basePrice: number;
  compareAtPrice?: number | null;
  lowestStock: number;
  totalStock: number;
  availableSizes: string[];
  availableColors: string[];
  tags: ProductTag[];
};

export type CartItem = {
  orderItemId?: string;
  productId: string;
  variantId: string;
  size: string;
  color: string;
  name: string;
  image: string;
  unitPrice: number;
  shippingRateAUD: number;
  quantity: number;
};

export type InventoryLog = {
  id: string;
  productId: string;
  variantId: string;
  productName: string;
  variantLabel: string;
  change: number;
  reason: string;
  holder: string | null;
  location: string | null;
  note: string | null;
  createdAt: string;
};
