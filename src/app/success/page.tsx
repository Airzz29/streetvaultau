import Link from "next/link";
import { getStripe } from "@/lib/stripe";
import { getOrderByStripeSessionId } from "@/lib/store-db";

type SuccessPageProps = {
  searchParams: {
    session_id?: string;
  };
};

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  let confirmState: "idle" | "ok" | "error" = "idle";
  let orderNumber: string | null = null;

  if (searchParams.session_id) {
    try {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(searchParams.session_id);
      if (session.payment_status === "paid") {
        confirmState = "ok";
        const order = getOrderByStripeSessionId(searchParams.session_id);
        orderNumber = order ? `#${order.id.slice(0, 8)}` : null;
      }
    } catch {
      confirmState = "error";
    }
  }

  return (
    <section className="mx-auto max-w-2xl space-y-5 rounded-2xl border border-emerald-900/70 bg-emerald-950/25 p-5 fade-slide-up sm:p-8">
      <p className="text-xs uppercase tracking-[0.24em] text-emerald-300">StreetVault Order Confirmed</p>
      <h1 className="text-2xl font-semibold text-emerald-300 sm:text-3xl">Payment successful</h1>
      <p className="text-sm text-zinc-300">Your order has been received and will be shipped within 1-2 business days.</p>
      {orderNumber ? (
        <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          Order number: <strong>{orderNumber}</strong>
        </div>
      ) : null}
      {confirmState === "ok" ? (
        <p className="text-xs text-emerald-300">Payment confirmed. Your order is available in your account orders.</p>
      ) : null}
      {confirmState === "error" ? (
        <p className="text-xs text-amber-300">
          Payment succeeded but confirmation lookup failed. Please check your account orders in a moment.
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/account/orders"
          className="inline-flex min-h-11 items-center rounded-xl bg-zinc-100 px-5 text-sm font-semibold text-zinc-900"
        >
          View My Orders
        </Link>
        <Link
          href="/shop"
          className="inline-flex min-h-11 items-center rounded-xl border border-white/20 px-5 text-sm font-semibold text-zinc-100"
        >
          Continue Shopping
        </Link>
      </div>
    </section>
  );
}
