import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { CartItem } from "@/types/product";
import { clearUserCart, listUserCartItems, replaceUserCart } from "@/lib/store-db";

const MAX_LINES = 40;
const MAX_QTY_PER_LINE = 99;

function sanitizeCartItems(items: CartItem[]) {
  const trimmed = items
    .filter((item) => item.variantId && item.productId && item.quantity > 0)
    .slice(0, MAX_LINES)
    .map((item) => ({
      ...item,
      quantity: Math.min(MAX_QTY_PER_LINE, Math.max(1, Math.floor(item.quantity))),
      shippingRateAUD: item.shippingRateAUD ?? 0,
    }));
  return trimmed;
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
