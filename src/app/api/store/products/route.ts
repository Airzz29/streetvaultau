import { NextRequest, NextResponse } from "next/server";
import { listProductsForCardsFiltered } from "@/lib/store-db";

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams;
  const query = search.get("q")?.toLowerCase().trim() ?? "";
  const category = search.get("category")?.toLowerCase().trim() ?? "all";
  const size = search.get("size")?.toLowerCase().trim() ?? "all";
  const sort = search.get("sort") ?? "newest";
  const products = listProductsForCardsFiltered({
    query,
    category,
    size,
    sort: sort as "newest" | "price_asc" | "price_desc" | "name_asc",
  });

  return NextResponse.json(
    { products },
    {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
      },
    }
  );
}
