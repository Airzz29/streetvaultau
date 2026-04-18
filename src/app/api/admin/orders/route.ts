import { NextResponse } from "next/server";
import { listLocalFulfillmentOrders } from "@/lib/store-db";
import { requireAdminPermission } from "@/lib/auth";

export async function GET() {
  const admin = await requireAdminPermission("orders");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orders = listLocalFulfillmentOrders();
  return NextResponse.json({ orders });
}
