import { NextRequest, NextResponse } from "next/server";
import { resendPendingEmailVerificationCode } from "@/lib/store-db";
import { sendEmailVerificationCodeEmail } from "@/lib/email";

type ResendBody = {
  email?: string;
};

export async function POST(request: NextRequest) {
  const body = (await request.json()) as ResendBody;
  const email = body.email?.trim().toLowerCase() ?? "";
  if (!email) return NextResponse.json({ error: "Email is required." }, { status: 400 });
  const result = resendPendingEmailVerificationCode(email);
  if (!result.ok) {
    if (result.reason === "cooldown") {
      return NextResponse.json(
        { error: `Please wait ${result.retryInSeconds}s before requesting another code.` },
        { status: 429 }
      );
    }
    if (result.reason === "rate_limited") {
      return NextResponse.json(
        { error: "Too many resend attempts. Start signup again." },
        { status: 429 }
      );
    }
    return NextResponse.json({ error: "No pending verification found." }, { status: 404 });
  }
  void sendEmailVerificationCodeEmail({
    to: email,
    code: result.code,
    expiresMinutes: 10,
  });
  return NextResponse.json({ ok: true, resendAvailableAt: result.resendAvailableAt });
}

