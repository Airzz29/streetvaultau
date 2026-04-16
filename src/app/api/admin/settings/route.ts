import { NextRequest, NextResponse } from "next/server";
import { getStoreSettings, updateStoreSettings } from "@/lib/store-db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(getStoreSettings());
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as {
    lowStockThreshold: number;
    shippingFlatRate: number;
  };
  const settings = updateStoreSettings({
    lowStockThreshold: Math.max(1, Number(body.lowStockThreshold ?? 3)),
    shippingFlatRate: Math.max(0, Number(body.shippingFlatRate ?? 10)),
  });
  return NextResponse.json(settings);
}
