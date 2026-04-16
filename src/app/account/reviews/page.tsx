"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";

type ReviewableItem = {
  orderItemId: string;
  orderId: string;
  productId: string;
  productName: string;
  image: string;
  size: string;
  color: string;
  createdAt: string;
  hasReview: boolean;
};

export default function AccountReviewsPage() {
  const [preferredOrderItemId, setPreferredOrderItemId] = useState("");
  const [items, setItems] = useState<ReviewableItem[]>([]);
  const [selectedOrderItemId, setSelectedOrderItemId] = useState("");
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");

  const load = async () => {
    const response = await fetch("/api/account/reviews", { cache: "no-store", credentials: "include" });
    const data = await response.json();
    const reviewables = (data.reviewables ?? []) as ReviewableItem[];
    setItems(reviewables);
  };

  useEffect(() => {
    load();
  }, []);

  const reviewableWithoutReview = useMemo(
    () => items.filter((item) => !item.hasReview),
    [items]
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setPreferredOrderItemId(params.get("orderItemId") ?? "");
    }
  }, []);

  useEffect(() => {
    const preferred = preferredOrderItemId;
    if (preferred && reviewableWithoutReview.some((item) => item.orderItemId === preferred)) {
      setSelectedOrderItemId(preferred);
      return;
    }
    if (!selectedOrderItemId && reviewableWithoutReview.length) {
      setSelectedOrderItemId(reviewableWithoutReview[0].orderItemId);
    }
  }, [preferredOrderItemId, reviewableWithoutReview, selectedOrderItemId]);

  const onUploadImages = async (files: FileList | null) => {
    if (!files?.length) return;
    const remaining = Math.max(0, 3 - images.length);
    const accepted = Array.from(files).slice(0, remaining);
    if (!accepted.length) return;
    const formData = new FormData();
    accepted.forEach((file) => formData.append("files", file));
    const response = await fetch("/api/account/reviews/uploads", {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Image upload failed.");
      return;
    }
    setImages((prev) => Array.from(new Set([...prev, ...((data.paths ?? []) as string[])])).slice(0, 3));
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    setError("");
    if (!selectedOrderItemId) {
      setError("Select a purchased item.");
      return;
    }
    if (!body.trim()) {
      setError("Review text is required.");
      return;
    }
    if (body.trim().length > 300) {
      setError("Review must be 300 characters or less.");
      return;
    }
    const response = await fetch("/api/account/reviews", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderItemId: selectedOrderItemId,
        rating,
        body,
        displayName: displayName.trim() || null,
        images,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Unable to submit review.");
      return;
    }
    setMessage("Review submitted successfully.");
    setBody("");
    setImages([]);
    await load();
  };

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Write a Review</h2>
      <p className="text-sm text-zinc-400">
        You can only review products you purchased in paid orders. One review per purchased item.
      </p>
      <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border border-white/10 bg-black/25 p-4">
        <select
          value={selectedOrderItemId}
          onChange={(event) => setSelectedOrderItemId(event.target.value)}
          className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
        >
          {reviewableWithoutReview.map((item) => (
            <option key={item.orderItemId} value={item.orderItemId}>
              {item.productName} ({item.color}/{item.size}) - #{item.orderId.slice(0, 8)}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className={`rounded border px-2 py-1 text-sm ${rating >= star ? "border-amber-300 text-amber-300" : "border-white/20 text-zinc-400"}`}
            >
              ★
            </button>
          ))}
        </div>
        <input
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder="Display name (optional)"
          className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
        />
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={300}
          placeholder="Share your experience (max 300 characters)"
          className="min-h-28 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
        />
        <p className="text-xs text-zinc-500">{body.length}/300</p>
        <input
          type="file"
          multiple
          accept="image/png,image/webp,image/jpeg,image/jpg"
          onChange={(event) => onUploadImages(event.target.files)}
          className="w-full text-xs file:mr-2 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-zinc-900"
        />
        <div className="flex flex-wrap gap-2">
          {images.map((image) => (
            <div key={image} className="relative h-16 w-16 overflow-hidden rounded border border-white/10">
              <Image src={image} alt="Review upload" fill sizes="64px" className="object-cover" />
            </div>
          ))}
        </div>
        <button className="rounded-xl bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-900">
          Submit Review
        </button>
        {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
      </form>
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Already reviewed</h3>
        {items.filter((item) => item.hasReview).map((item) => (
          <div key={item.orderItemId} className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-zinc-300">
            {item.productName} ({item.color}/{item.size}) - Review submitted
          </div>
        ))}
      </div>
    </section>
  );
}

