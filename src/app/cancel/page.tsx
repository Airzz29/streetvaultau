import Link from "next/link";

export default function CancelPage() {
  return (
    <section className="mx-auto max-w-xl space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 text-center fade-slide-up sm:p-8">
      <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">Checkout Interrupted</p>
      <h1 className="text-2xl font-semibold sm:text-3xl">Checkout Cancelled</h1>
      <p className="text-sm text-zinc-400">
        No worries, your cart is still here whenever you are ready.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Link
          href="/cart"
          className="inline-block rounded-md border border-zinc-700 px-5 py-2 text-sm font-semibold hover:border-zinc-500"
        >
          Return to Cart
        </Link>
        <Link
          href="/shop"
          className="inline-block rounded-md bg-zinc-100 px-5 py-2 text-sm font-semibold text-zinc-900"
        >
          Continue Shopping
        </Link>
      </div>
    </section>
  );
}
