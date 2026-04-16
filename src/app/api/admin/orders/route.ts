import { NextResponse } from "next/server";
import { listOrders } from "@/lib/store-db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orders = listOrders();
  return NextResponse.json({ orders });
}
