import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { CartItem } from "@/types/product";
import { computeShippingForItems, getUserAddressById, validateCartStock, validateDiscountCode } from "@/lib/store-db";

export async function POST(request: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Login required before checkout." }, { status: 401 });
  const body = (await request.json()) as { items: CartItem[]; addressId?: string; discountCode?: string };
  if (!body.items?.length) return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
  if (!body.addressId) {
    return NextResponse.json({ error: "Select a delivery address before checkout." }, { status: 400 });
  }
  const address = getUserAddressById(user.id, body.addressId);
  if (!address) return NextResponse.json({ error: "Selected address is invalid." }, { status: 400 });
  if (!address.phone?.trim()) {
    return NextResponse.json(
      { error: "A mobile number is required on the selected delivery address." },
      { status: 400 }
    );
  }
  const stock = validateCartStock(body.items);
  if (!stock.ok) return NextResponse.json({ error: stock.message }, { status: 400 });

  const subtotal = body.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const shipping = computeShippingForItems(body.items);
  let discountAmountAUD = 0;
  let discountCode: string | null = null;
  if (body.discountCode?.trim()) {
    const validation = validateDiscountCode({
      code: body.discountCode,
      userId: user.id,
      subtotalAUD: subtotal,
    });
    if (!validation.ok) {
      return NextResponse.json({ error: validation.message }, { status: 400 });
    }
    discountAmountAUD = validation.discountAmountAUD;
    discountCode = validation.code;
  }
  return NextResponse.json({
    subtotalAUD: subtotal,
    shippingAUD: shipping,
    discountAmountAUD,
    discountCode,
    totalAUD: subtotal - discountAmountAUD + shipping,
    address,
  });
}

