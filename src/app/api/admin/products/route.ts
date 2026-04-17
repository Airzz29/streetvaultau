import { NextRequest, NextResponse } from "next/server";
import {
  createProduct,
  getProductById,
  getProductBySlug,
  listMarketingSubscribers,
  listProductsWithVariants,
  updateProduct,
  deleteProduct,
} from "@/lib/store-db";
import { requireAdmin } from "@/lib/auth";
import { resolveAppBaseUrl } from "@/lib/app-url";
import { sendMarketingCampaignEmail } from "@/lib/email";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ products: listProductsWithVariants() });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const variants = (body.variants ?? []) as Array<{ price?: number }>;
  const createdPrice =
    variants.length > 0 ? Math.min(...variants.map((variant) => Number(variant.price ?? 0))) : 0;
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
  const created = getProductBySlug(body.slug);
  const subscribers = listMarketingSubscribers();
  if (created && subscribers.length > 0) {
    const appBaseUrl = resolveAppBaseUrl();
    const categoryLabelMap: Record<string, string> = {
      hoodie: "Hoodies",
      tee: "Shirts",
      pants: "Jeans / Pants",
      shoes: "Shoes",
      accessory: "Accessories",
      cap: "Accessories",
    };
    const categoryLabel = categoryLabelMap[created.category] ?? created.category;
    const variantsInStock = created.variants.filter((variant) => variant.stock > 0);
    const sizesInStock = Array.from(new Set(variantsInStock.map((variant) => variant.size)));
    const colorsInStock = Array.from(new Set(variantsInStock.map((variant) => variant.color)));
    const campaignBody = [
      `We just launched: ${created.name}.`,
      `Category: ${categoryLabel}`,
      `Starting from: ${createdPrice.toFixed(2)} AUD`,
      "",
      created.description,
    ].join("\n");
    void Promise.allSettled(
      subscribers.map((subscriber) =>
        sendMarketingCampaignEmail({
          to: subscriber.email,
          subject: `New drop: ${created.name}`,
          headline: `${created.name} is now live`,
          body: campaignBody,
          ctaLabel: "View Product",
          ctaUrl: `${appBaseUrl}/product/${created.slug}`,
          productHighlight: {
            name: created.name,
            image: created.mainImage ?? created.images[0] ?? null,
            sizesInStock,
            colorsInStock,
          },
        })
      )
    );
  }
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const before = getProductById(body.id);
  const beforeMinPrice = before?.variants.length
    ? Math.min(...before.variants.map((variant) => Number(variant.price)))
    : null;
  const nextVariants = (body.variants ?? []) as Array<{ price?: number }>;
  const nextMinPrice =
    nextVariants.length > 0
      ? Math.min(...nextVariants.map((variant) => Number(variant.price ?? 0)))
      : beforeMinPrice;
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
  const updated = getProductById(body.id);
  const subscribers = listMarketingSubscribers();
  if (
    before &&
    updated &&
    subscribers.length > 0 &&
    beforeMinPrice !== null &&
    nextMinPrice !== null &&
    Number.isFinite(beforeMinPrice) &&
    Number.isFinite(nextMinPrice) &&
    nextMinPrice < beforeMinPrice
  ) {
    const appBaseUrl = resolveAppBaseUrl();
    const variantsInStock = updated.variants.filter((variant) => variant.stock > 0);
    const sizesInStock = Array.from(new Set(variantsInStock.map((variant) => variant.size)));
    const colorsInStock = Array.from(new Set(variantsInStock.map((variant) => variant.color)));
    const discountAmount = beforeMinPrice - nextMinPrice;
    const bodyText = [
      `${updated.name} just got a price drop.`,
      `Now from: ${nextMinPrice.toFixed(2)} AUD`,
      `Previous: ${beforeMinPrice.toFixed(2)} AUD`,
      `You save: ${discountAmount.toFixed(2)} AUD`,
      "",
      "Tap below to shop before sizes sell out.",
    ].join("\n");
    void Promise.allSettled(
      subscribers.map((subscriber) =>
        sendMarketingCampaignEmail({
          to: subscriber.email,
          subject: `Price drop: ${updated.name}`,
          headline: `${updated.name} is now discounted`,
          body: bodyText,
          ctaLabel: "Shop Discounted Item",
          ctaUrl: `${appBaseUrl}/product/${updated.slug}`,
          productHighlight: {
            name: updated.name,
            image: updated.mainImage ?? updated.images[0] ?? null,
            sizesInStock,
            colorsInStock,
          },
        })
      )
    );
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  deleteProduct(body.id);
  return NextResponse.json({ ok: true });
}
