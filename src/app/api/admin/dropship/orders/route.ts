import { NextResponse } from "next/server";
import { listDropshipFulfillmentOrders } from "@/lib/store-db";
import { requireDropshipAccess } from "@/lib/auth";

export async function GET() {
  const staff = await requireDropshipAccess();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orders = listDropshipFulfillmentOrders();
  return NextResponse.json({ orders });
}
