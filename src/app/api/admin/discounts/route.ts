import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/auth";
import { createDiscountCode, deleteDiscountCode, listDiscountCodes, updateDiscountCode } from "@/lib/store-db";

export async function GET() {
  const admin = await requireAdminPermission("discounts");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ discounts: listDiscountCodes() });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdminPermission("discounts");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as {
    code: string;
    discountType: "percentage" | "fixed";
    discountValue: number;
    active: boolean;
    startsAt?: string | null;
    expiryAt?: string | null;
    usageLimit?: number | null;
    minimumOrderAUD?: number | null;
  };
  if (body.startsAt && body.expiryAt && new Date(body.startsAt).getTime() > new Date(body.expiryAt).getTime()) {
    return NextResponse.json(
      { error: "Start date must be before expiry date." },
      { status: 400 }
    );
  }
  createDiscountCode(body);
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdminPermission("discounts");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as {
    id: string;
    code: string;
    discountType: "percentage" | "fixed";
    discountValue: number;
    active: boolean;
    startsAt?: string | null;
    expiryAt?: string | null;
    usageLimit?: number | null;
    minimumOrderAUD?: number | null;
  };
  if (body.startsAt && body.expiryAt && new Date(body.startsAt).getTime() > new Date(body.expiryAt).getTime()) {
    return NextResponse.json(
      { error: "Start date must be before expiry date." },
      { status: 400 }
    );
  }
  updateDiscountCode(body.id, body);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const admin = await requireAdminPermission("discounts");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as { id: string };
  deleteDiscountCode(body.id);
  return NextResponse.json({ ok: true });
}

