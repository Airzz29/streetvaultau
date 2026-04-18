import { NextResponse } from "next/server";
import { getProductBySlug, listProductsWithVariants } from "@/lib/store-db";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const product = getProductBySlug(params.slug);
  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  const relatedProducts = listProductsWithVariants()
    .filter(
      (item) =>
        item.id !== product.id &&
        (item.category === product.category ||
          item.tags.some((tag) => product.tags.includes(tag)))
    )
    .slice(0, 4);

  return NextResponse.json(
    { product, relatedProducts },
    {
      headers: {
        "Cache-Control": "private, no-store",
      },
    }
  );
}
