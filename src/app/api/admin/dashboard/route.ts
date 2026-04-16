import { NextResponse } from "next/server";
import { getDashboardAnalytics } from "@/lib/store-db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(getDashboardAnalytics());
}
