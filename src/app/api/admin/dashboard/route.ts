import { NextResponse } from "next/server";
import { getDashboardAnalytics } from "@/lib/store-db";
import { requireAdminPermissionAny } from "@/lib/auth";

export async function GET() {
  const admin = await requireAdminPermissionAny(["dashboard", "analytics"]);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(getDashboardAnalytics());
}
