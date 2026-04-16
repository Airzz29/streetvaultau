import { OutfitSlot, ProductCategory, ProductTag } from "@/types/product";

export type SeedVariant = {
  size: string;
  color: string;
  price: number;
  stock: number;
  sku: string;
};

export type SeedProduct = {
  slug: string;
  name: string;
  category: ProductCategory;
  description: string;
  compareAtPrice: number | null;
  costPrice: number;
  images: string[];
  outfitSlot: OutfitSlot;
  tags: ProductTag[];
  variants: SeedVariant[];
};

export const seedProducts: SeedProduct[] = [
  {
    slug: "shadow-core-hoodie",
    name: "Shadow Core Hoodie",
    category: "hoodie",
    description:
      "Heavyweight brushed fleece hoodie with a premium matte finish and relaxed street silhouette.",
    compareAtPrice: 149,
    costPrice: 62,
    images: [
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=1200&q=80",
    ],
    outfitSlot: "top",
    tags: ["featured", "best_seller"],
    variants: [
      { size: "S", color: "Black", price: 119, stock: 2, sku: "QP-SCH-S-BLK" },
      { size: "M", color: "Black", price: 119, stock: 8, sku: "QP-SCH-M-BLK" },
      { size: "L", color: "Black", price: 119, stock: 0, sku: "QP-SCH-L-BLK" },
      { size: "XL", color: "Black", price: 119, stock: 3, sku: "QP-SCH-XL-BLK" },
    ],
  },
  {
    slug: "midnight-signal-tee",
    name: "Midnight Signal Tee",
    category: "tee",
    description:
      "Premium cotton oversized tee with subtle chest graphic and washed texture.",
    compareAtPrice: 89,
    costPrice: 28,
    images: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=1200&q=80",
    ],
    outfitSlot: "top",
    tags: ["featured", "new_arrival"],
    variants: [
      { size: "S", color: "White", price: 69, stock: 7, sku: "QP-MST-S-WHT" },
      { size: "M", color: "White", price: 69, stock: 12, sku: "QP-MST-M-WHT" },
      { size: "L", color: "White", price: 69, stock: 5, sku: "QP-MST-L-WHT" },
      { size: "XL", color: "White", price: 69, stock: 1, sku: "QP-MST-XL-WHT" },
    ],
  },
  {
    slug: "urban-taper-pants",
    name: "Urban Taper Pants",
    category: "pants",
    description:
      "Tailored utility pants with stretch weave, sharp taper, and concealed pocket structure.",
    compareAtPrice: 139,
    costPrice: 54,
    images: [
      "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=1200&q=80",
    ],
    outfitSlot: "bottom",
    tags: ["featured", "best_seller"],
    variants: [
      { size: "30", color: "Charcoal", price: 109, stock: 3, sku: "QP-UTP-30-CHA" },
      { size: "32", color: "Charcoal", price: 109, stock: 8, sku: "QP-UTP-32-CHA" },
      { size: "34", color: "Charcoal", price: 109, stock: 4, sku: "QP-UTP-34-CHA" },
      { size: "36", color: "Charcoal", price: 109, stock: 0, sku: "QP-UTP-36-CHA" },
    ],
  },
  {
    slug: "night-runner-cap",
    name: "Night Runner Cap",
    category: "cap",
    description:
      "Structured six-panel cap with tonal embroidery and clean curved brim.",
    compareAtPrice: null,
    costPrice: 17,
    images: [
      "https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=1200&q=80",
    ],
    outfitSlot: "accessory",
    tags: ["featured"],
    variants: [
      {
        size: "One Size",
        color: "Black",
        price: 49,
        stock: 20,
        sku: "QP-NRC-OS-BLK",
      },
    ],
  },
  {
    slug: "asphalt-tech-runner",
    name: "Asphalt Tech Runner",
    category: "shoes",
    description:
      "Low profile street runner with reflective detailing and cushioned performance sole.",
    compareAtPrice: 209,
    costPrice: 95,
    images: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=1200&q=80",
    ],
    outfitSlot: "accessory",
    tags: ["new_arrival"],
    variants: [
      { size: "8", color: "Black", price: 179, stock: 4, sku: "QP-ATR-8-BLK" },
      { size: "9", color: "Black", price: 179, stock: 6, sku: "QP-ATR-9-BLK" },
      { size: "10", color: "Black", price: 179, stock: 2, sku: "QP-ATR-10-BLK" },
      { size: "11", color: "Black", price: 179, stock: 0, sku: "QP-ATR-11-BLK" },
    ],
  },
  {
    slug: "drift-cargo-pants",
    name: "Drift Cargo Pants",
    category: "pants",
    description:
      "Relaxed cargo fit with engineered seams and technical matte hardware accents.",
    compareAtPrice: null,
    costPrice: 50,
    images: [
      "https://images.unsplash.com/photo-1517438476312-10d79c077509?auto=format&fit=crop&w=1200&q=80",
    ],
    outfitSlot: "bottom",
    tags: ["best_seller"],
    variants: [
      { size: "30", color: "Black", price: 115, stock: 5, sku: "QP-DCP-30-BLK" },
      { size: "32", color: "Black", price: 115, stock: 6, sku: "QP-DCP-32-BLK" },
      { size: "34", color: "Black", price: 115, stock: 2, sku: "QP-DCP-34-BLK" },
      { size: "36", color: "Black", price: 115, stock: 1, sku: "QP-DCP-36-BLK" },
    ],
  },
];
