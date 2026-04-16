import { notFound } from "next/navigation";
import { getProductBySlug, listApprovedReviewsByProductId, listProductsForCards } from "@/lib/store-db";
import { ProductCardData, ProductTag } from "@/types/product";
import { ProductDetailExperience } from "@/components/product-detail-experience";

type ProductPageProps = {
  params: {
    id: string;
  };
};

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

  return (
    <ProductDetailExperience
      product={product}
      relatedProducts={relatedProducts}
      reviews={reviews}
      hasMoreReviews={hasMoreReviews}
    />
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
