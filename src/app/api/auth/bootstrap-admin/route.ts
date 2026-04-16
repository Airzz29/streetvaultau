import { NextRequest, NextResponse } from "next/server";
import { countAdminUsers, createUser, getUserByEmail } from "@/lib/store-db";
import { hashPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    token?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
  };
  const expected = process.env.ADMIN_BOOTSTRAP_TOKEN;
  if (!expected || body.token !== expected) {
    return NextResponse.json({ error: "Invalid bootstrap token." }, { status: 401 });
  }
  if (countAdminUsers() > 0) {
    return NextResponse.json({ error: "Admin already exists." }, { status: 409 });
  }
  const email = body.email?.trim().toLowerCase() ?? "";
  if (!email || !body.password || !body.firstName || !body.lastName) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }
  if (getUserByEmail(email)) {
    return NextResponse.json({ error: "Email already exists." }, { status: 409 });
  }
  createUser({
    firstName: body.firstName,
    lastName: body.lastName,
    email,
    passwordHash: hashPassword(body.password),
    marketingOptIn: false,
    role: "admin",
  });
  return NextResponse.json({ ok: true });
}

