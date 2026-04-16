import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createProductReview, listReviewableOrderItems } from "@/lib/store-db";

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const reviewables = listReviewableOrderItems(user.id);
  return NextResponse.json({ reviewables });
}

export async function POST(request: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as {
    orderItemId?: string;
    rating?: number;
    body?: string;
    displayName?: string | null;
    images?: string[];
  };
  if (!body.orderItemId || !body.rating || !body.body?.trim()) {
    return NextResponse.json({ error: "Rating and review text are required." }, { status: 400 });
  }
  if (body.body.trim().length > 300) {
    return NextResponse.json({ error: "Review text must be 300 characters or less." }, { status: 400 });
  }
  if ((body.images ?? []).length > 3) {
    return NextResponse.json({ error: "Up to 3 review images are allowed." }, { status: 400 });
  }
  const result = createProductReview({
    userId: user.id,
    orderItemId: body.orderItemId,
    rating: body.rating,
    body: body.body,
    displayName: body.displayName ?? null,
    images: body.images ?? [],
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

