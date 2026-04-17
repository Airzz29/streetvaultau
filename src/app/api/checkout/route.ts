import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { CartItem } from "@/types/product";
import {
  computeShippingForItems,
  createUserAddress,
  getUserAddressById,
  upsertCheckoutDraft,
  validateDiscountCode,
  validateCartStock,
} from "@/lib/store-db";
import { buildStripeProductData } from "@/lib/stripe-checkout-images";
import { requireUser } from "@/lib/auth";
import { applyDiscountAcrossItems } from "@/lib/checkout-pricing";
import { resolveAppBaseUrl } from "@/lib/app-url";

type CheckoutRequestBody = {
  items: CartItem[];
  addressId?: string;
  shippingAddress?: {
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
  saveAddressForFuture?: boolean;
  discountCode?: string;
};

function isAustraliaOnlyCountry(value?: string | null) {
  const normalized = (value ?? "").trim().toLowerCase();
  return normalized === "australia" || normalized === "au";
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    if (!user) {
      return NextResponse.json({ error: "Login required before checkout." }, { status: 401 });
    }
    const body = (await request.json()) as CheckoutRequestBody;

    if (!body.items?.length) {
      return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
    }
    const stockCheck = validateCartStock(body.items);
    if (!stockCheck.ok) {
      return NextResponse.json({ error: stockCheck.message }, { status: 400 });
    }

    let address = body.addressId ? getUserAddressById(user.id, body.addressId) : null;
    if (address && !isAustraliaOnlyCountry(address.country)) {
      return NextResponse.json({ error: "Checkout currently supports Australia shipping only." }, { status: 400 });
    }
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
      if (!isAustraliaOnlyCountry(input.country)) {
        return NextResponse.json({ error: "Checkout currently supports Australia shipping only." }, { status: 400 });
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
          country: "Australia",
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
          country: "Australia",
          phone: input.phone.trim(),
          isDefault: false,
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

    const subtotalAUD = body.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    let discountAmountAUD = 0;
    let appliedCode: string | null = null;
    if (body.discountCode?.trim()) {
      const validation = validateDiscountCode({
        code: body.discountCode,
        userId: user.id,
        subtotalAUD,
      });
      if (!validation.ok) {
        return NextResponse.json({ error: validation.message }, { status: 400 });
      }
      discountAmountAUD = validation.discountAmountAUD;
      appliedCode = validation.code;
    }
    const discountedItems = applyDiscountAcrossItems(body.items, discountAmountAUD);

    const origin = resolveAppBaseUrl(request);
    const lineItems = discountedItems.map((cartItem) => ({
      quantity: cartItem.quantity,
      price_data: {
        currency: "aud",
        product_data: buildStripeProductData({
          name: `${cartItem.name} (${cartItem.size})`,
          image: cartItem.image,
          origin,
        }),
        unit_amount: cartItem.discountedUnitAmountCents,
      },
    }));
    const shippingTotal = computeShippingForItems(body.items);
    if (shippingTotal > 0) {
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: "aud",
          product_data: { name: "Shipping" },
          unit_amount: Math.round(shippingTotal * 100),
        },
      });
    }

    if (!lineItems.length) {
      return NextResponse.json(
        { error: "No valid items found for checkout." },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      shipping_address_collection: { allowed_countries: ["AU"] },
      line_items: lineItems,
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cancel`,
    });

    upsertCheckoutDraft(session.id, {
      items: body.items,
      userId: user.id,
      customerEmail: user.email,
      selectedAddressId: body.addressId || "manual-entry",
      shippingSnapshot: {
        firstName: address.firstName,
        lastName: address.lastName,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2,
        city: address.city,
        stateRegion: address.stateRegion,
        postcode: address.postcode,
        country: address.country,
        phone: address.phone,
      },
      discountCode: appliedCode,
      discountAmountAUD,
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      discountAmountAUD,
      discountCode: appliedCode,
    });
  } catch (error) {
    console.error("Checkout session error", error);
    return NextResponse.json(
      { error: "Unable to create checkout session." },
      { status: 500 }
    );
  }
}
