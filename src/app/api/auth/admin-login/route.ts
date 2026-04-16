import { NextRequest, NextResponse } from "next/server";
import { createUserSession, verifyPassword } from "@/lib/auth";
import { getUserByEmail } from "@/lib/store-db";

type AdminLoginBody = {
  email?: string;
  password?: string;
};

export async function POST(request: NextRequest) {
  const body = (await request.json()) as AdminLoginBody;
  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";
  const user = getUserByEmail(email);
  if (!user || user.role !== "admin" || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "Invalid admin credentials." }, { status: 401 });
  }
  await createUserSession(user.id, user.role);
  return NextResponse.json({ ok: true });
}

