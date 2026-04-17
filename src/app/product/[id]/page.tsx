import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug, listApprovedReviewsByProductId, listProductsForCards } from "@/lib/store-db";
import { ProductCardData, ProductTag } from "@/types/product";
import { ProductDetailExperience } from "@/components/product-detail-experience";

type ProductPageProps = {
  params: {
    id: string;
  };
};

export function generateMetadata({ params }: ProductPageProps): Metadata {
  const product = getProductBySlug(params.id);
  if (!product) {
    return {
      title: "Product | StreetVault",
      description: "Premium streetwear product from StreetVault.",
    };
  }
  const lowestPrice = product.variants.length
    ? Math.min(...product.variants.map((variant) => variant.price))
    : 0;
  return {
    title: `${product.name} | Streetwear Australia | StreetVault`,
    description: product.description.slice(0, 160),
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      title: `${product.name} | StreetVault`,
      description: product.description.slice(0, 160),
      url: `/product/${product.slug}`,
      images: product.mainImage ? [{ url: product.mainImage }] : undefined,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} | StreetVault`,
      description: product.description.slice(0, 160),
    },
    keywords: [
      "streetwear australia",
      "premium streetwear",
      "hoodies australia",
      "cargo pants australia",
      product.name.toLowerCase(),
      `${product.category} australia`,
      `${product.brand ?? "streetvault"} streetwear`,
      `${lowestPrice} aud`,
    ],
  };
}

export default function ProductPage({ params }: ProductPageProps) {
  const product = getProductBySlug(params.id);

  if (!product) {
    notFound();
  }

  const productBrand = (product.brand ?? "").trim().toLowerCase();
  const productTags = new Set(product.tags);
  const scoredRelatedProducts = listProductsForCards()
    .filter((item) => item.id !== product.id)
    .map((item) => ({ item, score: getRelatedProductScore(item, productBrand, product.category, productTags) }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.item.totalStock !== a.item.totalStock) return b.item.totalStock - a.item.totalStock;
      return a.item.name.localeCompare(b.item.name);
    });
  const relatedProducts = scoredRelatedProducts.map((entry) => entry.item).slice(0, 4);
  const productReviewsPreview = listApprovedReviewsByProductId(product.id, 11);
  const reviews = productReviewsPreview.slice(0, 10);
  const hasMoreReviews = productReviewsPreview.length > 10;
  const lowestPrice = product.variants.length
    ? Math.min(...product.variants.map((variant) => variant.price))
    : 0;
  const inStock = product.variants.some((variant) => variant.stock > 0);
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: [product.mainImage, ...product.images].filter(Boolean),
    sku: product.variants[0]?.sku ?? undefined,
    brand: { "@type": "Brand", name: product.brand ?? "StreetVault" },
    offers: {
      "@type": "Offer",
      priceCurrency: "AUD",
      price: lowestPrice.toFixed(2),
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `/product/${product.slug}`,
    },
    aggregateRating: reviews.length
      ? {
          "@type": "AggregateRating",
          ratingValue: (
            reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
          ).toFixed(1),
          reviewCount: reviews.length,
        }
      : undefined,
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "/" },
      { "@type": "ListItem", position: 2, name: "Shop", item: "/shop" },
      { "@type": "ListItem", position: 3, name: product.name, item: `/product/${product.slug}` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <ProductDetailExperience
        product={product}
        relatedProducts={relatedProducts}
        reviews={reviews}
        hasMoreReviews={hasMoreReviews}
      />
    </>
  );
}

function getRelatedProductScore(
  item: ProductCardData,
  productBrand: string,
  productCategory: string,
  productTags: Set<ProductTag>
) {
  let score = 0;
  const itemBrand = (item.brand ?? "").trim().toLowerCase();
  if (productBrand && itemBrand && itemBrand === productBrand) {
    score += 120;
  }
  if (item.category === productCategory) {
    score += 40;
  }
  const matchingTagsCount = item.tags.reduce(
    (sum, tag) => (productTags.has(tag) ? sum + 1 : sum),
    0
  );
  score += matchingTagsCount * 8;
  if (item.tags.includes("best_seller")) {
    score += 4;
  }
  if (item.tags.includes("new_arrival")) {
    score += 3;
  }
  return score;
}
