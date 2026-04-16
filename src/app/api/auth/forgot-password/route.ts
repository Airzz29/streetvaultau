import { NextRequest, NextResponse } from "next/server";
import { createPasswordResetToken, getUserByEmail } from "@/lib/store-db";
import { createRawResetToken } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";

type ForgotBody = { email?: string };

export async function POST(request: NextRequest) {
  const body = (await request.json()) as ForgotBody;
  const email = body.email?.trim().toLowerCase() ?? "";
  const user = getUserByEmail(email);

  if (user) {
    const token = createRawResetToken();
    const expires = new Date(Date.now() + 1000 * 60 * 60).toISOString();
    createPasswordResetToken({ userId: user.id, tokenHash: token.hash, expiresAt: expires });
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL ?? "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(token.raw)}`;
    void sendPasswordResetEmail({ to: user.email, resetUrl });
  }

  return NextResponse.json({
    ok: true,
    message: "If an account exists for that email, we sent a reset link.",
  });
}

