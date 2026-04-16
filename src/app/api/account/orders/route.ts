import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { listOrdersByCustomerEmail, listOrdersByUserId } from "@/lib/store-db";

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const byUser = listOrdersByUserId(user.id);
  const fallbackByEmail = listOrdersByCustomerEmail(user.email);
  const merged = Array.from(
    new Map([...byUser, ...fallbackByEmail].map((order) => [order.id, order])).values()
  );
  return NextResponse.json({ orders: merged });
}

