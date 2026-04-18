import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/auth";
import { applyOrderFulfillmentPatch, OrderFulfillmentPatchBody } from "@/lib/admin-order-fulfillment-update";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdminPermission("orders");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as OrderFulfillmentPatchBody;

  const result = await applyOrderFulfillmentPatch(params.id, body, "admin");
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ order: result.order });
}
