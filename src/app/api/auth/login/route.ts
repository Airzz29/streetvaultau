import { NextRequest, NextResponse } from "next/server";
import { createUserSession, verifyPassword } from "@/lib/auth";
import { getUserByEmail } from "@/lib/store-db";

type LoginBody = {
  email?: string;
  password?: string;
};

export async function POST(request: NextRequest) {
  const body = (await request.json()) as LoginBody;
  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";
  const user = getUserByEmail(email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }
  await createUserSession(user.id, user.role);
  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      marketingOptIn: user.marketingOptIn,
    },
  });
}

