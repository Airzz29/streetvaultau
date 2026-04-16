import { NextRequest, NextResponse } from "next/server";
import { hashPassword, requireUser, verifyPassword } from "@/lib/auth";
import { setUserPasswordHash, updateUserProfile } from "@/lib/store-db";

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({
    profile: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      marketingOptIn: user.marketingOptIn,
    },
  });
}

export async function PATCH(request: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as {
    firstName?: string;
    lastName?: string;
    phone?: string;
    marketingOptIn?: boolean;
    currentPassword?: string;
    newPassword?: string;
  };
  if (body.newPassword) {
    if (!body.currentPassword || !verifyPassword(body.currentPassword, user.passwordHash)) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    }
    if (body.newPassword.length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });
    }
    setUserPasswordHash(user.id, hashPassword(body.newPassword));
  }
  const updated = updateUserProfile(user.id, {
    firstName: body.firstName ?? user.firstName,
    lastName: body.lastName ?? user.lastName,
    phone: body.phone ?? user.phone,
    marketingOptIn: body.marketingOptIn ?? user.marketingOptIn,
  });
  return NextResponse.json({ profile: updated });
}

