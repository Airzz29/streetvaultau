"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ReviewsFilterControlsProps = {
  categories: string[];
  initialCategory: string;
  initialQuery: string;
  initialRating: string;
  initialProductId: string;
  initialProductName?: string;
};

export function ReviewsFilterControls({
  categories,
  initialCategory,
  initialQuery,
  initialRating,
  initialProductId,
  initialProductName = "",
}: ReviewsFilterControlsProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [rating, setRating] = useState(initialRating);

  const applyFilters = (overrides?: {
    q?: string;
    category?: string;
    rating?: string;
    includeProductId?: boolean;
  }) => {
    const params = new URLSearchParams();
    const finalQuery = (overrides?.q ?? query).trim().toLowerCase();
    const finalCategory = overrides?.category ?? category;
    const finalRating = overrides?.rating ?? rating;
    const includeProductId = overrides?.includeProductId ?? Boolean(initialProductId);
    if (finalQuery) params.set("q", finalQuery);
    if (finalCategory) params.set("category", finalCategory);
    if (finalRating) params.set("rating", finalRating);
    if (includeProductId && initialProductId) params.set("productId", initialProductId);
    router.push(params.toString() ? `/reviews?${params.toString()}` : "/reviews");
  };

  const activeChips = [
    initialProductId
      ? {
          key: "product",
          label: initialProductName ? `Product: ${initialProductName}` : "Filtered product",
          onRemove: () => applyFilters({ includeProductId: false }),
        }
      : null,
    category
      ? {
          key: "category",
          label: `Category: ${category}`,
          onRemove: () => {
            setCategory("");
            applyFilters({ category: "" });
          },
        }
      : null,
    query
      ? {
          key: "query",
          label: `Search: ${query}`,
          onRemove: () => {
            setQuery("");
            applyFilters({ q: "" });
          },
        }
      : null,
    rating
      ? {
          key: "rating",
          label: `${rating}★`,
          onRemove: () => {
            setRating("");
            applyFilters({ rating: "" });
          },
        }
      : null,
  ].filter(Boolean) as Array<{ key: string; label: string; onRemove: () => void }>;

  return (
    <div className="grid gap-3 rounded-2xl border border-white/10 bg-black/55 p-3 backdrop-blur-xl transition">
      <div className="grid gap-2 sm:grid-cols-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              applyFilters({ q: query });
            }
          }}
          placeholder="Search product or brand"
          className="min-h-11 rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm transition focus:border-zinc-300"
        />
        <select
          value={category}
          onChange={(event) => {
            const next = event.target.value;
            setCategory(next);
            applyFilters({ category: next });
          }}
          className="min-h-11 rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm transition focus:border-zinc-300"
        >
          <option value="">All categories</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select
          value={rating}
          onChange={(event) => {
            const next = event.target.value;
            setRating(next);
            applyFilters({ rating: next });
          }}
          className="min-h-11 rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm transition focus:border-zinc-300"
        >
          <option value="">All ratings</option>
          <option value="5">5 stars</option>
          <option value="4">4 stars</option>
          <option value="3">3 stars</option>
          <option value="2">2 stars</option>
          <option value="1">1 star</option>
        </select>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => applyFilters({ q: query })}
          className="min-h-10 rounded-xl bg-zinc-100 px-4 py-1.5 text-sm font-semibold text-zinc-900 transition hover:bg-white"
        >
          Apply
        </button>
        <button
          type="button"
          onClick={() => {
            setQuery("");
            setCategory("");
            setRating("");
            router.push(initialProductId ? `/reviews?productId=${encodeURIComponent(initialProductId)}` : "/reviews");
          }}
          className="min-h-10 rounded-xl border border-white/20 px-4 py-1.5 text-sm text-zinc-200 transition hover:bg-white/10"
        >
          Clear
        </button>
      </div>
      <div className="text-xs text-zinc-400">
        Filters work together: category + search (product/brand) + rating.
      </div>
      {activeChips.length ? (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {activeChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={chip.onRemove}
              className="inline-flex min-h-8 items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 text-xs text-zinc-100 transition hover:border-white/35 hover:bg-white/15"
              aria-label={`Remove ${chip.label} filter`}
            >
              <span>{chip.label}</span>
              <span aria-hidden>×</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

