import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import {
  listDiscountCodes,
  listMarketingSubscribers,
  listProductsWithVariants,
} from "@/lib/store-db";
import { resolveAppBaseUrl } from "@/lib/app-url";
import { sendMarketingCampaignEmail } from "@/lib/email";

type CampaignBody = {
  subject?: string;
  headline?: string;
  body?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  testEmail?: string;
  sendMode?: "test" | "subscribers";
};

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subscribers = listMarketingSubscribers();
  const products = listProductsWithVariants()
    .slice(0, 30)
    .map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      active: product.active,
      newArrival: product.newArrival,
      bestSeller: product.bestSeller,
      compareAtPrice: product.compareAtPrice,
      minPrice: product.variants[0]?.price ?? 0,
    }));
  const discounts = listDiscountCodes()
    .filter((discount) => Boolean(discount.active))
    .slice(0, 20)
    .map((discount) => ({
      id: discount.id,
      code: discount.code,
      discountType: discount.discount_type,
      discountValue: discount.discount_value,
      expiryAt: discount.expiry_at,
    }));

  return NextResponse.json({
    subscribersCount: subscribers.length,
    subscribersPreview: subscribers.slice(0, 8),
    products,
    discounts,
  });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as CampaignBody;
  const subject = body.subject?.trim() ?? "";
  const headline = body.headline?.trim() ?? "";
  const messageBody = body.body?.trim() ?? "";
  if (!subject || !headline || !messageBody) {
    return NextResponse.json(
      { error: "Subject, headline, and email body are required." },
      { status: 400 }
    );
  }

  const siteUrl = resolveAppBaseUrl();
  const ctaUrl = body.ctaUrl?.trim() || `${siteUrl}/shop`;
  const ctaLabel = body.ctaLabel?.trim() || "Shop Now";
  const sendMode = body.sendMode ?? "subscribers";

  if (sendMode === "test") {
    const testEmail = body.testEmail?.trim().toLowerCase();
    if (!testEmail) {
      return NextResponse.json({ error: "Test email is required for test send." }, { status: 400 });
    }
    await sendMarketingCampaignEmail({
      to: testEmail,
      subject,
      headline,
      body: messageBody,
      ctaLabel,
      ctaUrl,
    });
    return NextResponse.json({ ok: true, mode: "test", sentCount: 1 });
  }

  const subscribers = listMarketingSubscribers();
  if (subscribers.length === 0) {
    return NextResponse.json({ ok: true, mode: "subscribers", sentCount: 0 });
  }

  const results = await Promise.allSettled(
    subscribers.map((subscriber) =>
      sendMarketingCampaignEmail({
        to: subscriber.email,
        subject,
        headline,
        body: messageBody,
        ctaLabel,
        ctaUrl,
      })
    )
  );
  const sentCount = results.filter((result) => result.status === "fulfilled").length;
  return NextResponse.json({
    ok: true,
    mode: "subscribers",
    sentCount,
    failedCount: subscribers.length - sentCount,
  });
}
