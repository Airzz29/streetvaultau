import Link from "next/link";
import { getStripe } from "@/lib/stripe";

type SuccessPageProps = {
  searchParams: {
    session_id?: string;
  };
};

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  let confirmState: "idle" | "ok" | "error" = "idle";

  if (searchParams.session_id) {
    try {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(searchParams.session_id);
      if (session.payment_status === "paid") {
        confirmState = "ok";
      }
    } catch {
      confirmState = "error";
    }
  }

  return (
    <section className="mx-auto max-w-xl space-y-4 rounded-2xl border border-emerald-900/70 bg-emerald-950/25 p-5 text-center fade-slide-up sm:p-8">
      <p className="text-xs uppercase tracking-[0.24em] text-emerald-300">StreetVault Order Confirmed</p>
      <h1 className="text-2xl font-semibold text-emerald-300 sm:text-3xl">Payment Successful</h1>
      <p className="text-sm text-zinc-300">
        Thank you for shopping with StreetVault. Your order is now in our fulfillment queue.
      </p>
      {confirmState === "ok" ? (
        <p className="text-xs text-emerald-300">Order status synced to admin dashboard.</p>
      ) : null}
      {confirmState === "error" ? (
        <p className="text-xs text-amber-300">
          Payment succeeded but order sync failed. Use webhook/admin refresh.
        </p>
      ) : null}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Link
          href="/shop"
          className="inline-block rounded-md bg-white px-5 py-2 text-sm font-semibold text-zinc-900"
        >
          Continue Shopping
        </Link>
        <Link
          href="/cart"
          className="inline-block rounded-md border border-white/20 px-5 py-2 text-sm font-semibold text-zinc-100"
        >
          View Cart
        </Link>
      </div>
    </section>
  );
}
