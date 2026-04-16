import { listApprovedReviews, listProductsForCards } from "@/lib/store-db";
import { ReviewCard } from "@/components/review-card";
import Link from "next/link";
import { ReviewsFilterControls } from "@/components/reviews-filter-controls";

type ReviewsPageProps = {
  searchParams: {
    rating?: string;
    productId?: string;
    category?: string;
    q?: string;
  };
};

export default function ReviewsPage({ searchParams }: ReviewsPageProps) {
  const ratingFilter = Number(searchParams.rating || 0);
  const productIdFilter = (searchParams.productId ?? "").trim();
  const categoryFilter = (searchParams.category ?? "").trim().toLowerCase();
  const query = (searchParams.q ?? "").trim().toLowerCase();
  const products = listProductsForCards();
  const productById = new Map(products.map((product) => [product.id, product]));
  const categories = Array.from(new Set(products.map((product) => product.category))).sort();
  const productOptions = products
    .map((product) => ({ id: product.id, name: product.name, slug: product.slug }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const selectedProduct = productOptions.find((product) => product.id === productIdFilter) ?? null;
  const reviews = listApprovedReviews(500).filter((review) => {
    const ratingOk = ratingFilter >= 1 && ratingFilter <= 5 ? review.rating === ratingFilter : true;
    const productOk = productIdFilter ? review.productId === productIdFilter : true;
    const product = productById.get(review.productId);
    const categoryOk = categoryFilter ? product?.category === categoryFilter : true;
    const searchOk = query
      ? `${review.productName} ${product?.brand ?? ""}`.toLowerCase().includes(query)
      : true;
    return ratingOk && productOk && categoryOk && searchOk;
  });

  return (
    <section className="mx-auto w-full max-w-7xl space-y-4 pb-4">
      <h1 className="text-3xl font-semibold">Customer Reviews</h1>
      <p className="text-sm text-zinc-400">
        Verified buyer reviews from paid StreetVault orders.
        {selectedProduct ? ` Showing all reviews for ${selectedProduct.name}.` : ""}
      </p>
      {selectedProduct ? (
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-3">
          <p className="text-sm text-zinc-300">Viewing filtered reviews for {selectedProduct.name}</p>
          <Link
            href={`/product/${selectedProduct.slug}`}
            className="rounded-lg border border-white/20 px-3 py-1.5 text-sm text-zinc-100 hover:bg-white/10"
          >
            Back to Product
          </Link>
        </div>
      ) : null}
      <div className="sticky top-[72px] z-30">
        <ReviewsFilterControls
          categories={categories}
          initialCategory={categoryFilter}
          initialQuery={query}
          initialRating={ratingFilter >= 1 && ratingFilter <= 5 ? String(ratingFilter) : ""}
          initialProductId={productIdFilter}
          initialProductName={selectedProduct?.name ?? ""}
        />
      </div>
      <div className="grid gap-2 sm:grid-cols-1">
        <div className="overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max gap-2">
          <Link href="/reviews" className="rounded-lg border border-white/15 px-3 py-1.5 text-sm">
            All Products
          </Link>
          {productOptions.slice(0, 14).map((product) => (
            <Link
              key={product.id}
              href={`/reviews?productId=${encodeURIComponent(product.id)}`}
              className={`rounded-lg border px-3 py-1.5 text-sm ${
                productIdFilter === product.id ? "border-zinc-100 text-zinc-100" : "border-white/15"
              }`}
            >
              {product.name}
            </Link>
          ))}
          </div>
        </div>
      </div>
      {reviews.length ? (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-center">
          <p className="text-sm text-zinc-300">No reviews found.</p>
          <p className="mt-1 text-xs text-zinc-500">Try adjusting your filters or search query.</p>
          <Link
            href="/reviews"
            className="mt-3 inline-flex rounded-xl border border-white/20 px-4 py-2 text-sm text-zinc-100 hover:bg-white/10"
          >
            Reset Filters
          </Link>
        </div>
      )}
    </section>
  );
}

