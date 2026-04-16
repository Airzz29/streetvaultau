import { NextRequest, NextResponse } from "next/server";
import {
  createUser,
  deletePendingEmailVerification,
  getUserByEmail,
  verifyPendingEmailVerification,
} from "@/lib/store-db";
import { createUserSession } from "@/lib/auth";
import { sendWelcomeEmail } from "@/lib/email";

type VerifyBody = {
  email?: string;
  code?: string;
};

export async function POST(request: NextRequest) {
  const body = (await request.json()) as VerifyBody;
  const email = body.email?.trim().toLowerCase() ?? "";
  const code = body.code?.trim() ?? "";
  if (!email || !code) {
    return NextResponse.json({ error: "Email and verification code are required." }, { status: 400 });
  }
  const verified = verifyPendingEmailVerification({ email, code });
  if (!verified.ok) {
    const message =
      verified.reason === "expired"
        ? "Verification code expired. Request a new code."
        : verified.reason === "invalid_code"
          ? "Invalid verification code."
          : "No pending verification found for this email.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
  if (getUserByEmail(email)) {
    deletePendingEmailVerification(email);
    return NextResponse.json({ error: "Account already exists. Please log in." }, { status: 409 });
  }
  const user = createUser({
    firstName: verified.pending.firstName,
    lastName: verified.pending.lastName,
    email: verified.pending.email,
    passwordHash: verified.pending.passwordHash,
    marketingOptIn: verified.pending.marketingOptIn,
    role: "customer",
  });
  if (!user) {
    return NextResponse.json({ error: "Unable to activate account." }, { status: 500 });
  }
  deletePendingEmailVerification(email);
  await createUserSession(user.id, user.role);
  void sendWelcomeEmail({ to: user.email, firstName: user.firstName });
  return NextResponse.json({ ok: true });
}

