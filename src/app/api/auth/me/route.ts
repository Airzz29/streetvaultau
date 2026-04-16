import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ user: null });
  return NextResponse.json({
    user: {
      id: session.user.id,
      firstName: session.user.firstName,
      lastName: session.user.lastName,
      email: session.user.email,
      role: session.user.role,
      marketingOptIn: session.user.marketingOptIn,
      phone: session.user.phone,
      lastActiveAt: session.user.lastActiveAt,
    },
  });
}

