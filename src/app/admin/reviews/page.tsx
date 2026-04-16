"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ProductReview } from "@/types/review";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | "approved" | "hidden" | "pending">("all");

  const load = async () => {
    const query = statusFilter === "all" ? "" : `?status=${statusFilter}`;
    const response = await fetch(`/api/admin/reviews${query}`, {
      cache: "no-store",
      credentials: "include",
    });
    const data = await response.json();
    setReviews(data.reviews ?? []);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Reviews</h2>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
          className="rounded-md border border-white/20 bg-black/30 px-3 py-2 text-sm"
        >
          <option value="all">All</option>
          <option value="approved">Approved</option>
          <option value="hidden">Hidden</option>
          <option value="pending">Pending</option>
        </select>
      </div>
      <div className="space-y-3">
        {reviews.map((review) => (
          <article key={review.id} className="rounded-xl border border-white/10 bg-black/25 p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-semibold">{review.productName}</p>
                <p className="text-xs text-zinc-500">
                  {review.displayName || "Anonymous"} · {"★".repeat(review.rating)} · {new Date(review.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span className="rounded border border-white/20 px-2 py-1 text-xs">{review.status}</span>
            </div>
            <p className="mt-2 text-sm text-zinc-200">{review.body}</p>
            {review.images.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {review.images.map((image) => (
                  <div key={image} className="relative h-16 w-16 overflow-hidden rounded border border-white/10">
                    <Image src={image} alt="Review image" fill sizes="64px" className="object-cover" />
                  </div>
                ))}
              </div>
            ) : null}
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={async () => {
                  await fetch("/api/admin/reviews", {
                    method: "PATCH",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: review.id, status: "approved" }),
                  });
                  await load();
                }}
                className="rounded border border-emerald-400/40 px-2 py-1 text-xs text-emerald-200"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={async () => {
                  await fetch("/api/admin/reviews", {
                    method: "PATCH",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: review.id, status: "hidden" }),
                  });
                  await load();
                }}
                className="rounded border border-amber-400/40 px-2 py-1 text-xs text-amber-200"
              >
                Hide
              </button>
              <button
                type="button"
                onClick={async () => {
                  await fetch("/api/admin/reviews", {
                    method: "DELETE",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: review.id }),
                  });
                  await load();
                }}
                className="rounded border border-red-400/40 px-2 py-1 text-xs text-red-200"
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

