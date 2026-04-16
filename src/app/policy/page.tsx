import Link from "next/link";
import { BackNavButton } from "@/components/back-nav-button";

export default function PolicyPage() {
  return (
    <section className="mx-auto max-w-3xl space-y-5 rounded-2xl border border-white/10 bg-black/25 p-5 backdrop-blur-xl sm:p-7">
      <BackNavButton fallbackHref="/" label="Back" />
      <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">StreetVault Policy</p>
      <h1 className="text-3xl font-semibold">No Refund or Return Policy</h1>
      <p className="text-sm text-zinc-300">
        For hygiene, safety, and quality-control reasons, all StreetVault purchases are final. We do not
        provide refunds, exchanges, or returns once an order is placed.
      </p>

      <div className="space-y-3 rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-zinc-300">
        <p className="font-semibold text-zinc-100">Why this policy exists</p>
        <p>
          Our products are packed and handled under strict standards. Accepting returns can compromise
          product safety and quality for other customers, so this policy helps us maintain a clean and
          secure process for everyone.
        </p>
      </div>

      <div className="space-y-3 rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-zinc-300">
        <p className="font-semibold text-zinc-100">Need support?</p>
        <p>
          If there is a major issue with your order, contact us and our team will review it carefully.
          This includes shipment problems, damaged arrival reports, or urgent order concerns.
        </p>
        <Link
          href="/contact"
          className="inline-flex min-h-10 items-center rounded-lg bg-zinc-100 px-4 text-sm font-semibold text-zinc-900 hover:bg-white"
        >
          Contact Support
        </Link>
      </div>
    </section>
  );
}
