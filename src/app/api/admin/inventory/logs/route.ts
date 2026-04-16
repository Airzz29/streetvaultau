import { NextResponse } from "next/server";
import { listInventoryLogs } from "@/lib/store-db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ logs: listInventoryLogs(100) });
}
