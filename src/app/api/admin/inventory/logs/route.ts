import { NextResponse } from "next/server";
import { listInventoryLogs } from "@/lib/store-db";
import { requireAdminPermission } from "@/lib/auth";

export async function GET() {
  const admin = await requireAdminPermission("inventory");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ logs: listInventoryLogs(100) });
}
