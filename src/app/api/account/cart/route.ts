import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { CartItem } from "@/types/product";
import { clearUserCart, listUserCartItems, replaceUserCart } from "@/lib/store-db";

function sanitizeCartItems(items: CartItem[]) {
  return items
    .filter((item) => item.variantId && item.productId && item.quantity > 0)
    .map((item) => ({
      ...item,
      quantity: Math.max(1, Math.floor(item.quantity)),
      shippingRateAUD: item.shippingRateAUD ?? 0,
    }));
}

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ items: listUserCartItems(user.id) });
}

export async function PUT(request: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as { items?: CartItem[] };
  const items = sanitizeCartItems(Array.isArray(body.items) ? body.items : []);
  const saved = replaceUserCart(user.id, items);
  return NextResponse.json({ items: saved });
}

export async function DELETE() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  clearUserCart(user.id);
  return NextResponse.json({ ok: true });
}
