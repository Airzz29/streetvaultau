import { NextRequest, NextResponse } from "next/server";
import { consumePasswordResetToken, setUserPasswordHash } from "@/lib/store-db";
import { hashPassword, hashProvidedResetToken } from "@/lib/auth";

type ResetBody = {
  token?: string;
  password?: string;
  confirmPassword?: string;
};

export async function POST(request: NextRequest) {
  const body = (await request.json()) as ResetBody;
  const token = body.token?.trim() ?? "";
  const password = body.password ?? "";
  const confirmPassword = body.confirmPassword ?? "";
  if (!token) return NextResponse.json({ error: "Reset token is required." }, { status: 400 });
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }
  if (password !== confirmPassword) {
    return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
  }
  const consumed = consumePasswordResetToken(hashProvidedResetToken(token));
  if (!consumed) {
    return NextResponse.json({ error: "Reset link is invalid or expired." }, { status: 400 });
  }
  setUserPasswordHash(consumed.userId, hashPassword(password));
  return NextResponse.json({ ok: true });
}

