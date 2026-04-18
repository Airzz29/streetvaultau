import { NextResponse } from "next/server";
import { listPremadeFitCards } from "@/lib/store-db";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { fits: listPremadeFitCards() },
    {
      headers: {
        "Cache-Control": "private, no-store",
      },
    }
  );
}
