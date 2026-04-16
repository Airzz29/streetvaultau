import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { listUsersWithStats } from "@/lib/store-db";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const search = request.nextUrl.searchParams.get("q") ?? "";
  const users = listUsersWithStats(search).map((user) => ({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    marketingOptIn: user.marketingOptIn,
    phone: user.phone,
    createdAt: user.createdAt,
    lastActiveAt: user.lastActiveAt,
    addresses: user.addresses,
    orderCount: user.orderCount,
    totalSpendAUD: user.totalSpendAUD,
  }));
  return NextResponse.json({ users });
}

