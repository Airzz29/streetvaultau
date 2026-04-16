"use client";

import { useMemo, useState } from "react";
import { ProductCardData } from "@/types/product";
import { ProductCard } from "@/components/product-card";
import { BackNavButton } from "@/components/back-nav-button";

type ShopClientProps = {
  initialProducts: ProductCardData[];
};

export function ShopClient({ initialProducts }: ShopClientProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [size, setSize] = useState("all");
  const [sort, setSort] = useState("newest");

  const categories = useMemo(
    () => ["all", ...Array.from(new Set(initialProducts.map((product) => product.category)))],
    [initialProducts]
  );
  const sizes = ["all", "S", "M", "L", "XL", "30", "32", "34", "36", "8", "9", "10", "11"];

  const filteredProducts = useMemo(() => {
    let products = [...initialProducts];

    if (query.trim()) {
      products = products.filter((product) =>
        product.name.toLowerCase().includes(query.trim().toLowerCase())
      );
    }
    if (category !== "all") {
      products = products.filter((product) => product.category === category);
    }
    if (size !== "all") {
      products = products.filter((product) => product.availableSizes.includes(size));
    }

    if (sort === "price_asc") {
      products.sort((a, b) => a.basePrice - b.basePrice);
    } else if (sort === "price_desc") {
      products.sort((a, b) => b.basePrice - a.basePrice);
    } else if (sort === "name_asc") {
      products.sort((a, b) => a.name.localeCompare(b.name));
    }
    return products;
  }, [initialProducts, query, category, size, sort]);

  return (
    <section className="space-y-5">
      <BackNavButton fallbackHref="/" label="Back" />
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold sm:text-4xl">Shop All</h1>
        <p className="text-zinc-400">
          Refined streetwear essentials with premium cuts, limited stock, and fast shipping.
        </p>
      </div>

      <div className="grid gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-3 sm:grid-cols-2 sm:gap-3 sm:p-4 lg:grid-cols-5">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search products..."
          className="min-h-11 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
        />
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="min-h-11 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
        >
          {categories.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <select
          value={size}
          onChange={(event) => setSize(event.target.value)}
          className="min-h-11 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
        >
          {sizes.map((option) => (
            <option key={option} value={option}>
              Size {option}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(event) => setSort(event.target.value)}
          className="min-h-11 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
        >
          <option value="newest">Newest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="name_asc">Name: A-Z</option>
        </select>
        <div className="flex items-center text-sm text-zinc-400">
          Showing {filteredProducts.length} items
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
