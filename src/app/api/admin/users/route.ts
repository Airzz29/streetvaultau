import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/auth";
import { countAdminUsers, getUserById, listUsersWithStats, setUserRole } from "@/lib/store-db";

export async function GET(request: NextRequest) {
  const admin = await requireAdminPermission("users");
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

export async function PATCH(request: NextRequest) {
  const admin = await requireAdminPermission("users");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as { userId?: string; role?: string };
  const userId = body.userId?.trim();
  const role = body.role?.trim();
  if (!userId || !role) {
    return NextResponse.json({ error: "Missing user id or role." }, { status: 400 });
  }

  const allowed = new Set(["customer", "admin", "supplier"]);
  if (!allowed.has(role)) {
    return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  }

  if (userId === admin.id && role !== "admin") {
    return NextResponse.json({ error: "You cannot change your own role away from admin." }, { status: 400 });
  }

  const target = getUserById(userId);
  if (!target) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (target.role === "admin" && role !== "admin") {
    if (countAdminUsers() <= 1) {
      return NextResponse.json({ error: "Cannot remove the last admin." }, { status: 400 });
    }
  }

  setUserRole(userId, role as "customer" | "admin" | "supplier");
  return NextResponse.json({ ok: true });
}

