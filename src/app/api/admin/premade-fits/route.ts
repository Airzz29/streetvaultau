import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/auth";
import {
  createPremadeFit,
  deletePremadeFit,
  getProductById,
  listPremadeFits,
  updatePremadeFit,
} from "@/lib/store-db";
import { storefrontVariantAvailability } from "@/lib/fulfillment";
import { PremadeFitItemSlot, PremadeFitSelectionMode } from "@/types/premade-fit";

type FitItemInput = {
  slot?: PremadeFitItemSlot;
  isOptional?: boolean;
  productId: string;
  itemMainImage?: string | null;
  selectionMode?: PremadeFitSelectionMode;
  allowedColors?: string[];
  allowedSizes?: string[];
  defaultVariantId?: string | null;
  sortOrder?: number;
};

type FitBody = {
  id?: string;
  slug?: string;
  name?: string;
  description?: string;
  coverImage?: string;
  galleryImages?: string[];
  bundlePriceAUD?: number | null;
  active?: boolean;
  featured?: boolean;
  items?: FitItemInput[];
};

function normalizeItems(items: FitItemInput[] = []) {
  return items
    .map((item, index) => ({
      slot: item.slot ?? "top",
      isOptional: Boolean(item.isOptional),
      productId: item.productId,
      itemMainImage: item.itemMainImage ?? null,
      selectionMode: item.selectionMode ?? "fixed",
      allowedColors: item.allowedColors ?? [],
      allowedSizes: item.allowedSizes ?? [],
      defaultVariantId: item.defaultVariantId ?? null,
      sortOrder: item.sortOrder ?? index,
    }))
    .filter((item) => item.productId);
}

function applyLiveStockConstraints(items: ReturnType<typeof normalizeItems>) {
  return items.map((item) => {
    const product = getProductById(item.productId);
    const sellableVariants = (product?.variants ?? []).filter((variant) =>
      product
        ? storefrontVariantAvailability(
            product.fulfillmentType,
            variant.stock,
            product.allowDropshipFallback
          ) !== "sold_out"
        : false
    );
    const sellableColors = Array.from(new Set(sellableVariants.map((variant) => variant.color)));
    const sellableSizes = Array.from(new Set(sellableVariants.map((variant) => variant.size)));
    const allowedColors = item.allowedColors.length
      ? item.allowedColors.filter((color) => sellableColors.includes(color))
      : sellableColors;
    const allowedSizes = item.allowedSizes.length
      ? item.allowedSizes.filter((size) => sellableSizes.includes(size))
      : sellableSizes;
    const defaultVariantStillValid = sellableVariants.some(
      (variant) =>
        variant.id === item.defaultVariantId &&
        allowedColors.includes(variant.color) &&
        allowedSizes.includes(variant.size)
    );
    return {
      ...item,
      allowedColors,
      allowedSizes,
      defaultVariantId: defaultVariantStillValid ? item.defaultVariantId : sellableVariants[0]?.id ?? null,
    };
  });
}

function validateStructuredFit(items: ReturnType<typeof normalizeItems>) {
  const tops = items.filter((item) => item.slot === "top");
  const hoodies = items.filter((item) => item.slot === "hoodie");
  const bottoms = items.filter((item) => item.slot === "pants");
  const shoes = items.filter((item) => item.slot === "shoes");
  if (tops.length + hoodies.length < 1) return "Premade fit requires at least one upper item (shirt or hoodie).";
  if (tops.length + hoodies.length > 2) return "Premade fit allows up to two upper items (shirt + hoodie).";
  if (tops.length > 1 || hoodies.length > 1) return "Only one shirt and one hoodie can be included.";
  if (bottoms.length !== 1) return "Premade fit requires exactly one bottom item.";
  if (shoes.length > 1) return "Only one shoes item can be included.";
  for (const item of items) {
    const product = getProductById(item.productId);
    if (!product) return "One or more selected products no longer exist.";
    const productType = (product.productType ?? "").toLowerCase();
    if (item.slot === "top" && product.category !== "tee") {
      return "Top slot only accepts shirt products.";
    }
    if (item.slot === "hoodie" && product.category !== "hoodie") {
      return "Hoodie slot only accepts hoodie products.";
    }
    if (item.slot === "pants") {
      if (product.category !== "pants") {
        return "Bottom slot only accepts bottoms products.";
      }
      if (
        productType &&
        !["shorts", "jeans", "joggers", "pants"].some((token) => productType.includes(token))
      ) {
        return "Bottom item must be Shorts, Jeans, or Joggers/Pants.";
      }
    }
    if (item.slot === "shoes" && product.category !== "shoes") {
      return "Shoes slot only accepts shoes products.";
    }
    if (item.slot === "accessory" && !["accessory", "cap"].includes(product.category)) {
      return "Accessories slot only accepts accessories.";
    }
  }
  return null;
}

export async function GET() {
  const admin = await requireAdminPermission("premade-fits");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ fits: listPremadeFits({ includeInactive: true }) });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdminPermission("premade-fits");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as FitBody;
  if (!body.slug || !body.name || !body.description || !body.coverImage) {
    return NextResponse.json({ error: "Name, slug, description, and cover image are required." }, { status: 400 });
  }
  const items = applyLiveStockConstraints(normalizeItems(body.items ?? []));
  const structureError = validateStructuredFit(items);
  if (structureError) {
    return NextResponse.json({ error: structureError }, { status: 400 });
  }
  const fit = createPremadeFit({
    slug: body.slug,
    name: body.name,
    description: body.description,
    coverImage: body.coverImage,
    galleryImages: body.galleryImages ?? [body.coverImage],
    active: body.active ?? true,
    featured: body.featured ?? false,
    items,
  });
  return NextResponse.json({ fit });
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdminPermission("premade-fits");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as FitBody;
  if (!body.id) return NextResponse.json({ error: "Fit id is required." }, { status: 400 });
  if (!body.slug || !body.name || !body.description || !body.coverImage) {
    return NextResponse.json({ error: "Name, slug, description, and cover image are required." }, { status: 400 });
  }
  const items = applyLiveStockConstraints(normalizeItems(body.items ?? []));
  const structureError = validateStructuredFit(items);
  if (structureError) {
    return NextResponse.json({ error: structureError }, { status: 400 });
  }
  const fit = updatePremadeFit(body.id, {
    slug: body.slug,
    name: body.name,
    description: body.description,
    coverImage: body.coverImage,
    galleryImages: body.galleryImages ?? [body.coverImage],
    bundlePriceAUD: body.bundlePriceAUD,
    active: body.active ?? true,
    featured: body.featured ?? false,
    items,
  });
  return NextResponse.json({ fit });
}

export async function DELETE(request: NextRequest) {
  const admin = await requireAdminPermission("premade-fits");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as { id?: string };
  if (!body.id) return NextResponse.json({ error: "Fit id is required." }, { status: 400 });
  deletePremadeFit(body.id);
  return NextResponse.json({ ok: true });
}
