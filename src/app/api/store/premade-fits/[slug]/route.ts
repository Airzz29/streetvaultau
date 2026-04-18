import { NextResponse } from "next/server";
import { getPremadeFitBySlug, listPremadeFitCards } from "@/lib/store-db";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const fit = getPremadeFitBySlug(params.slug);
  if (!fit) {
    return NextResponse.json({ error: "Premade fit not found." }, { status: 404 });
  }
  const relatedFits = listPremadeFitCards()
    .filter((entry) => entry.id !== fit.id)
    .slice(0, 4);

  return NextResponse.json(
    { fit, relatedFits },
    {
      headers: {
        "Cache-Control": "private, no-store",
      },
    }
  );
}
