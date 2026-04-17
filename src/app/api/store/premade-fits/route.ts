import { NextResponse } from "next/server";
import { listPremadeFitCards } from "@/lib/store-db";

export async function GET() {
  return NextResponse.json(
    { fits: listPremadeFitCards() },
    {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
      },
    }
  );
}
