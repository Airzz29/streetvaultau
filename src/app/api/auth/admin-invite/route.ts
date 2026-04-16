import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  createUser,
  getAdminInviteByTokenHash,
  getUserByEmail,
  markAdminInviteAccepted,
} from "@/lib/store-db";
import { hashPassword } from "@/lib/auth";

function hashInviteToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")?.trim() ?? "";
  if (!token) return NextResponse.json({ valid: false, error: "Missing token." }, { status: 400 });
  const invite = getAdminInviteByTokenHash(hashInviteToken(token));
  if (!invite || invite.acceptedAt || invite.isExpired) {
    return NextResponse.json({ valid: false, error: "Invite is invalid or expired." }, { status: 400 });
  }
  return NextResponse.json({
    valid: true,
    email: invite.email,
    expiresAt: invite.expiresAt,
  });
}

type CompleteInviteBody = {
  token?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  confirmPassword?: string;
};

export async function POST(request: NextRequest) {
  const body = (await request.json()) as CompleteInviteBody;
  const token = body.token?.trim() ?? "";
  const firstName = body.firstName?.trim() ?? "";
  const lastName = body.lastName?.trim() ?? "";
  const password = body.password ?? "";
  const confirmPassword = body.confirmPassword ?? "";

  if (!token) return NextResponse.json({ error: "Invite token is required." }, { status: 400 });
  if (!firstName || !lastName) {
    return NextResponse.json({ error: "First and last name are required." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }
  if (password !== confirmPassword) {
    return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
  }

  const invite = getAdminInviteByTokenHash(hashInviteToken(token));
  if (!invite || invite.acceptedAt || invite.isExpired) {
    return NextResponse.json({ error: "Invite is invalid or expired." }, { status: 400 });
  }

  const existing = getUserByEmail(invite.email);
  if (existing) {
    return NextResponse.json(
      { error: "An account for this email already exists. Ask an admin to promote it directly." },
      { status: 409 }
    );
  }

  createUser({
    firstName,
    lastName,
    email: invite.email,
    passwordHash: hashPassword(password),
    marketingOptIn: false,
    role: "admin",
  });
  markAdminInviteAccepted(invite.id);
  return NextResponse.json({ ok: true });
}
