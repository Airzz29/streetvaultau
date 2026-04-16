import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { CartItem } from "@/types/product";
import {
  computeShippingForItems,
  createUserAddress,
  getUserAddressById,
  validateCartStock,
  validateDiscountCode,
} from "@/lib/store-db";

type ShippingInput = {
  firstName?: string;
  lastName?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  stateRegion?: string;
  postcode?: string;
  country?: string;
  phone?: string;
};

export async function POST(request: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Login required before checkout." }, { status: 401 });
  const body = (await request.json()) as {
    items: CartItem[];
    addressId?: string;
    shippingAddress?: ShippingInput;
    saveAddressForFuture?: boolean;
    discountCode?: string;
  };
  if (!body.items?.length) return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
  let address = body.addressId ? getUserAddressById(user.id, body.addressId) : null;
  if (!address && body.shippingAddress) {
    const input = body.shippingAddress;
    if (
      !input.firstName?.trim() ||
      !input.lastName?.trim() ||
      !input.addressLine1?.trim() ||
      !input.city?.trim() ||
      !input.stateRegion?.trim() ||
      !input.postcode?.trim() ||
      !input.country?.trim()
    ) {
      return NextResponse.json({ error: "Please complete all required delivery fields." }, { status: 400 });
    }
    if (!input.phone?.trim()) {
      return NextResponse.json({ error: "Mobile number is required for shipping." }, { status: 400 });
    }
    if (body.saveAddressForFuture) {
      const updatedAddresses = createUserAddress(user.id, {
        firstName: input.firstName,
        lastName: input.lastName,
        addressLine1: input.addressLine1,
        addressLine2: input.addressLine2,
        city: input.city,
        stateRegion: input.stateRegion,
        postcode: input.postcode,
        country: input.country,
        phone: input.phone,
        isDefault: false,
      });
      address =
        updatedAddresses.find(
          (item) =>
            item.firstName === input.firstName?.trim() &&
            item.lastName === input.lastName?.trim() &&
            item.addressLine1 === input.addressLine1?.trim() &&
            item.postcode === input.postcode?.trim() &&
            (item.phone ?? "") === input.phone?.trim()
        ) ?? updatedAddresses[0] ?? null;
    } else {
      address = {
        id: "temporary",
        userId: user.id,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        addressLine1: input.addressLine1.trim(),
        addressLine2: input.addressLine2?.trim() || null,
        city: input.city.trim(),
        stateRegion: input.stateRegion.trim(),
        postcode: input.postcode.trim(),
        country: input.country.trim(),
        phone: input.phone.trim(),
        isDefault: false,
        createdAt: "",
        updatedAt: "",
      };
    }
  }
  if (!address) {
    return NextResponse.json({ error: "Add delivery details or select a saved address." }, { status: 400 });
  }
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

