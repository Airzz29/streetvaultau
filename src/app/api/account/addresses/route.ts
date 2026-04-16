import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createUserAddress, listUserAddresses, updateUserAddress } from "@/lib/store-db";

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ addresses: listUserAddresses(user.id) });
}

export async function POST(request: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as {
    firstName?: string;
    lastName?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    stateRegion?: string;
    postcode?: string;
    country?: string;
    phone?: string;
    isDefault?: boolean;
  };
  if (!body.firstName || !body.lastName || !body.addressLine1 || !body.city || !body.stateRegion || !body.postcode || !body.country) {
    return NextResponse.json({ error: "Missing required address fields." }, { status: 400 });
  }
  const addresses = createUserAddress(user.id, {
    firstName: body.firstName,
    lastName: body.lastName,
    addressLine1: body.addressLine1,
    addressLine2: body.addressLine2,
    city: body.city,
    stateRegion: body.stateRegion,
    postcode: body.postcode,
    country: body.country,
    phone: body.phone,
    isDefault: Boolean(body.isDefault),
  });
  return NextResponse.json({ addresses });
}

export async function PATCH(request: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as {
    id?: string;
    firstName?: string;
    lastName?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    stateRegion?: string;
    postcode?: string;
    country?: string;
    phone?: string;
    isDefault?: boolean;
  };
  if (!body.id || !body.firstName || !body.lastName || !body.addressLine1 || !body.city || !body.stateRegion || !body.postcode || !body.country) {
    return NextResponse.json({ error: "Missing required address fields." }, { status: 400 });
  }
  const addresses = updateUserAddress(user.id, body.id, {
    firstName: body.firstName,
    lastName: body.lastName,
    addressLine1: body.addressLine1,
    addressLine2: body.addressLine2,
    city: body.city,
    stateRegion: body.stateRegion,
    postcode: body.postcode,
    country: body.country,
    phone: body.phone,
    isDefault: Boolean(body.isDefault),
  });
  return NextResponse.json({ addresses });
}

