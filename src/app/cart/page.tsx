"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/cart-context";
import { formatPriceAUD } from "@/lib/utils";

export default function CartPage() {
  const { items, removeItem, updateQuantity } = useCart();
  const router = useRouter();
  const [discountCode, setDiscountCode] = useState("");
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [items]
  );
  const shipping = useMemo(
    () => items.reduce((sum, item) => sum + (item.shippingRateAUD ?? 0) * item.quantity, 0),
    [items]
  );
  const total = subtotal + shipping;

  useEffect(() => {
    const stored = window.localStorage.getItem("streetvault-discount-code") ?? "";
    setDiscountCode(stored);
  }, []);

  if (!items.length) {
    return (
      <section className="space-y-4 rounded-2xl border border-white/10 bg-black/25 p-6 text-center backdrop-blur-xl">
        <h1 className="text-3xl font-semibold">Your Cart</h1>
        <p className="text-zinc-400">Your cart is currently empty. Build a fit and come back here.</p>
        <Link
          href="/shop"
          className="inline-block rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900"
        >
          Start Shopping
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-6 fade-slide-up">
      <h1 className="text-2xl font-semibold sm:text-3xl">Your Cart</h1>
      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-3">
          {items.map((item) => (
            <article
              key={item.variantId}
              className="rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur-xl"
            >
              <div className="flex items-start gap-3">
                <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-zinc-800">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="80px"
                    className="object-contain p-1.5"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 font-medium">{item.name}</p>
                  <p className="text-sm text-zinc-400">
                    {item.color} / {item.size}
                  </p>
                  <p className="text-xs text-zinc-500">
                    Shipping {formatPriceAUD(item.shippingRateAUD)} each
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 p-1">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                    className="min-h-11 rounded-lg px-3 py-2 text-base text-zinc-100 hover:bg-white/10"
                  >
                    -
                  </button>
                  <span className="min-w-8 text-center text-base font-semibold">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                    className="min-h-11 rounded-lg px-3 py-2 text-base text-zinc-100 hover:bg-white/10"
                  >
                    +
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-right text-base font-semibold">
                    {formatPriceAUD(item.unitPrice * item.quantity)}
                  </p>
                  <button
                    onClick={() => removeItem(item.variantId)}
                    className="min-h-11 rounded-lg border border-red-500/40 px-3 py-2 text-sm text-red-200 hover:bg-red-500/10"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <aside className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 lg:sticky lg:top-24 lg:h-fit">
          <p className="text-sm uppercase tracking-[0.18em] text-zinc-400">Order Summary</p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400">Subtotal</span>
            <span>{formatPriceAUD(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400">Shipping</span>
            <span>{shipping === 0 ? "Free" : formatPriceAUD(shipping)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-zinc-800 pt-3 text-lg font-semibold">
            <span>Total</span>
            <span>{formatPriceAUD(total)}</span>
          </div>
          <button
            onClick={() => {
              window.localStorage.setItem("streetvault-discount-code", discountCode.trim().toUpperCase());
              const query = discountCode.trim() ? `?discount=${encodeURIComponent(discountCode.trim().toUpperCase())}` : "";
              router.push(`/checkout${query}`);
            }}
            className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-zinc-900"
          >
            Continue to Secure Checkout
          </button>
          <div className="space-y-2 rounded-xl border border-white/10 bg-black/30 p-3">
            <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">Discount Code</p>
            <input
              value={discountCode}
              onChange={(event) => setDiscountCode(event.target.value.toUpperCase())}
              placeholder="Enter discount code"
              className="min-h-10 w-full rounded-lg border border-white/15 bg-black/30 px-3 text-sm"
            />
          </div>
          <p className="text-xs text-zinc-500">
            Express shipping is calculated per item. Checkout is available for Australia only.
          </p>
        </aside>
      </div>
    </section>
  );
}
