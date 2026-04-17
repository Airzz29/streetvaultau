"use client";

import { useMemo, useState } from "react";
import { ProductCardData } from "@/types/product";
import { ProductCard } from "@/components/product-card";
import { BackNavButton } from "@/components/back-nav-button";

type CategoryPageContentProps = {
  title: string;
  subtitle: string;
  products: ProductCardData[];
  enableBottomsTypeFilter?: boolean;
};

export function CategoryPageContent({
  title,
  subtitle,
  products,
  enableBottomsTypeFilter = false,
}: CategoryPageContentProps) {
  const [query, setQuery] = useState("");
  const [bottomsType, setBottomsType] = useState<"all" | "joggers" | "shorts" | "jeans">("all");
  const normalizedQuery = query.trim().toLowerCase();
  const filteredProducts = useMemo(() => {
    let next = products;
    if (normalizedQuery) {
      next = next.filter((product) =>
        `${product.name} ${product.brand ?? ""}`.toLowerCase().includes(normalizedQuery)
      );
    }
    if (enableBottomsTypeFilter && bottomsType !== "all") {
      next = next.filter((product) =>
        (product.productType ?? "").trim().toLowerCase().includes(bottomsType)
      );
    }
    return next;
  }, [bottomsType, enableBottomsTypeFilter, normalizedQuery, products]);

  return (
    <section className="space-y-6 fade-slide-up">
      <BackNavButton fallbackHref="/" label="Back" />
      <div className="rounded-2xl border border-white/15 bg-white/[0.05] p-5 backdrop-blur-xl sm:p-6">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm text-zinc-300">{subtitle}</p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Search ${title.toLowerCase()} by product or brand`}
            className="min-h-11 w-full rounded-xl border border-white/15 bg-black/30 px-3 text-sm sm:max-w-md"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="min-h-11 rounded-xl border border-white/20 px-4 text-sm text-zinc-200 hover:bg-white/10"
            >
              Clear
            </button>
          ) : null}
          {enableBottomsTypeFilter ? (
            <select
              value={bottomsType}
              onChange={(event) => setBottomsType(event.target.value as typeof bottomsType)}
              className="min-h-11 rounded-xl border border-white/15 bg-black/30 px-3 text-sm sm:w-52"
            >
              <option value="all">All bottoms</option>
              <option value="joggers">Joggers</option>
              <option value="shorts">Shorts</option>
              <option value="jeans">Jeans</option>
            </select>
          ) : null}
        </div>
      </div>
      {filteredProducts.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-black/25 p-6 text-center">
          <p className="text-sm text-zinc-300">No products found.</p>
          <button
            type="button"
            onClick={() => setQuery("")}
            className="mt-3 rounded-xl border border-white/20 px-4 py-2 text-sm text-zinc-100 hover:bg-white/10"
          >
            Clear Search
          </button>
        </div>
      )}
    </section>
  );
}
