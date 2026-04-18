import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";

/** Lightweight role hint for client UI (e.g. show admin-only nav links). */
export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ user: null });
  }
  return NextResponse.json({
    user: {
      id: session.user.id,
      role: session.user.role,
      adminPermissions: session.user.adminPermissions ?? null,
    },
  });
}
