 "use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { ProductReview } from "@/types/review";

export function ReviewCard({ review }: { review: ProductReview }) {
  const [expanded, setExpanded] = useState(false);
  const maxLength = 180;
  const shouldTruncate = review.body.length > maxLength;
  const previewText = useMemo(
    () => (shouldTruncate && !expanded ? `${review.body.slice(0, maxLength).trimEnd()}...` : review.body),
    [expanded, review.body, shouldTruncate]
  );

  return (
    <article className="anim-float-in group rounded-3xl border border-white/10 bg-black/25 p-5 transition duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-black/35">
      <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">{review.productName}</p>
      <p className="mt-2 text-base tracking-wide text-amber-300">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</p>
      <p className="mt-3 text-sm leading-6 text-zinc-200">{previewText}</p>
      {shouldTruncate ? (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-2 text-xs text-zinc-300 underline decoration-white/25 underline-offset-2 hover:text-zinc-100"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      ) : null}
      {review.images.length ? (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {review.images.map((image) => (
            <div key={image} className="relative h-20 overflow-hidden rounded-xl border border-white/10 bg-black/30">
              <Image
                src={image}
                alt="Review"
                fill
                sizes="128px"
                className="object-cover transition duration-300 group-hover:scale-105"
              />
            </div>
          ))}
        </div>
      ) : null}
      <p className="mt-4 text-xs text-zinc-500">
        {review.displayName || "Verified buyer"} · {new Date(review.createdAt).toLocaleDateString()}
      </p>
    </article>
  );
}

