import { NextRequest, NextResponse } from "next/server";
import { listApprovedReviews, listApprovedReviewsByProductId } from "@/lib/store-db";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const productId = params.get("productId");
  const limit = Math.min(100, Math.max(1, Number(params.get("limit") ?? 24)));
  const rating = params.get("rating") ? Number(params.get("rating")) : null;
  const reviews = productId ? listApprovedReviewsByProductId(productId, limit) : listApprovedReviews(limit);
  const filtered = rating ? reviews.filter((review) => review.rating === rating) : reviews;
  return NextResponse.json(
    { reviews: filtered.slice(0, limit) },
    {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=180, stale-while-revalidate=300",
      },
    }
  );
}

