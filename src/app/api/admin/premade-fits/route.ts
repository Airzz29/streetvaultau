import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import {
  createPremadeFit,
  deletePremadeFit,
  listPremadeFits,
  updatePremadeFit,
} from "@/lib/store-db";
import { PremadeFitSelectionMode } from "@/types/premade-fit";

type FitItemInput = {
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
  active?: boolean;
  featured?: boolean;
  items?: FitItemInput[];
};

function normalizeItems(items: FitItemInput[] = []) {
  return items
    .map((item, index) => ({
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

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ fits: listPremadeFits({ includeInactive: true }) });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as FitBody;
  if (!body.slug || !body.name || !body.description || !body.coverImage) {
    return NextResponse.json({ error: "Name, slug, description, and cover image are required." }, { status: 400 });
  }
  const fit = createPremadeFit({
    slug: body.slug,
    name: body.name,
    description: body.description,
    coverImage: body.coverImage,
    galleryImages: body.galleryImages ?? [body.coverImage],
    active: body.active ?? true,
    featured: body.featured ?? false,
    items: normalizeItems(body.items ?? []),
  });
  return NextResponse.json({ fit });
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as FitBody;
  if (!body.id) return NextResponse.json({ error: "Fit id is required." }, { status: 400 });
  if (!body.slug || !body.name || !body.description || !body.coverImage) {
    return NextResponse.json({ error: "Name, slug, description, and cover image are required." }, { status: 400 });
  }
  const fit = updatePremadeFit(body.id, {
    slug: body.slug,
    name: body.name,
    description: body.description,
    coverImage: body.coverImage,
    galleryImages: body.galleryImages ?? [body.coverImage],
    active: body.active ?? true,
    featured: body.featured ?? false,
    items: normalizeItems(body.items ?? []),
  });
  return NextResponse.json({ fit });
}

export async function DELETE(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as { id?: string };
  if (!body.id) return NextResponse.json({ error: "Fit id is required." }, { status: 400 });
  deletePremadeFit(body.id);
  return NextResponse.json({ ok: true });
}
