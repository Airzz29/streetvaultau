import { NextRequest, NextResponse } from "next/server";
import {
  createProduct,
  listProductsWithVariants,
  updateProduct,
  deleteProduct,
} from "@/lib/store-db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ products: listProductsWithVariants() });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  createProduct({
    slug: body.slug,
    name: body.name,
    brand: body.brand ?? null,
    collection: body.collection ?? null,
    productType: body.productType ?? null,
    category: body.category,
    description: body.description,
    compareAtPrice: body.compareAtPrice ?? null,
    costPrice: Number(body.costPrice),
    shippingRateAUD: Number(body.shippingRateAUD ?? 12),
    images: body.images,
    mainImage: body.mainImage ?? null,
    builderImage: body.mainImage ?? body.builderImage ?? null,
    colorImageGroups: body.colorImageGroups ?? [],
    defaultVariantKey: body.defaultVariantKey ?? null,
    barcode: body.barcode ?? null,
    active: body.active ?? true,
    featured: body.featured ?? false,
    bestSeller: body.bestSeller ?? false,
    newArrival: body.newArrival ?? false,
    outfitSlot: body.outfitSlot,
    tags: body.tags ?? [],
    variants: body.variants ?? [],
  });
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  updateProduct({
    id: body.id,
    slug: body.slug,
    name: body.name,
    brand: body.brand ?? null,
    collection: body.collection ?? null,
    productType: body.productType ?? null,
    category: body.category,
    description: body.description,
    compareAtPrice: body.compareAtPrice ?? null,
    costPrice: Number(body.costPrice),
    shippingRateAUD: Number(body.shippingRateAUD ?? 12),
    images: body.images,
    mainImage: body.mainImage ?? null,
    builderImage: body.mainImage ?? body.builderImage ?? null,
    colorImageGroups: body.colorImageGroups ?? [],
    defaultVariantKey: body.defaultVariantKey ?? null,
    barcode: body.barcode ?? null,
    active: body.active ?? true,
    featured: body.featured ?? false,
    bestSeller: body.bestSeller ?? false,
    newArrival: body.newArrival ?? false,
    outfitSlot: body.outfitSlot,
    tags: body.tags ?? [],
    variants: body.variants ?? [],
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  deleteProduct(body.id);
  return NextResponse.json({ ok: true });
}
