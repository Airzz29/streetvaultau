import { NextRequest, NextResponse } from "next/server";
import { createOrUpdatePendingEmailVerification, getUserByEmail } from "@/lib/store-db";
import { hashPassword } from "@/lib/auth";
import { sendEmailVerificationCodeEmail } from "@/lib/email";
import { validateSignupEmail } from "@/lib/email-validation";

type SignupBody = {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  marketingOptIn?: boolean;
};

export async function POST(request: NextRequest) {
  const body = (await request.json()) as SignupBody;
  const firstName = body.firstName?.trim() ?? "";
  const lastName = body.lastName?.trim() ?? "";
  const rawEmail = body.email?.trim() ?? "";
  const password = body.password ?? "";
  const confirmPassword = body.confirmPassword ?? "";

  if (!firstName || !lastName) {
    return NextResponse.json({ error: "First and last name are required." }, { status: 400 });
  }
  const emailValidation = validateSignupEmail(rawEmail);
  if (!emailValidation.ok) return NextResponse.json({ error: emailValidation.message }, { status: 400 });
  const email = emailValidation.email;
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }
  if (password !== confirmPassword) {
    return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
  }
  if (getUserByEmail(email)) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const verification = createOrUpdatePendingEmailVerification({
    firstName,
    lastName,
    email,
    passwordHash: hashPassword(password),
    marketingOptIn: Boolean(body.marketingOptIn),
  });
  void sendEmailVerificationCodeEmail({
    to: email,
    firstName,
    code: verification.code,
    expiresMinutes: 10,
  });

  return NextResponse.json({
    ok: true,
    requiresVerification: true,
    email,
    resendAvailableAt: verification.resendAvailableAt,
  });
}

