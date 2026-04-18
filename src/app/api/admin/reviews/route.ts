import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/auth";
import { deleteReview, listReviewsForAdmin, updateReviewStatus } from "@/lib/store-db";

export async function GET(request: NextRequest) {
  const admin = await requireAdminPermission("reviews");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const status = request.nextUrl.searchParams.get("status") as "pending" | "approved" | "hidden" | null;
  const reviews = listReviewsForAdmin(status ?? undefined);
  return NextResponse.json({ reviews });
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdminPermission("reviews");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as { id?: string; status?: "pending" | "approved" | "hidden" };
  if (!body.id || !body.status) return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  updateReviewStatus(body.id, body.status);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const admin = await requireAdminPermission("reviews");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as { id?: string };
  if (!body.id) return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  deleteReview(body.id);
  return NextResponse.json({ ok: true });
}

