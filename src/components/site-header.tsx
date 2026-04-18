"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/context/cart-context";
import { categoryNavItems } from "@/components/category-nav";
import { CurrencyPickerButton } from "@/components/currency-picker-button";
import { ShippingRegionModal } from "@/components/shipping-region-modal";

export function SiteHeader({ initialLoggedIn = false }: { initialLoggedIn?: boolean }) {
  const pathname = usePathname();
  const { totalItems } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const loggedIn = initialLoggedIn;
  const isAdmin = pathname?.startsWith("/admin") ?? false;

  return (
    <>
    <header className="sticky top-0 z-50 border-b border-white/5 bg-black/20 backdrop-blur-xl">
      <div className="mx-auto w-full max-w-7xl px-3 py-3 sm:px-6 lg:px-8">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:gap-3">
          <button
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="inline-flex min-h-11 items-center rounded-full border border-zinc-700/60 px-4 text-sm font-medium text-zinc-200 md:hidden"
          >
            Menu
          </button>
          <Link
            href="/"
            className="text-center text-xs font-semibold uppercase tracking-[0.28em] text-zinc-100 sm:text-sm sm:tracking-[0.32em]"
          >
            StreetVault
          </Link>
          <div className="flex items-center justify-end gap-2">
            {!isAdmin ? <CurrencyPickerButton /> : null}
            <Link
              href="/contact"
              className="hidden min-h-11 items-center rounded-full border border-zinc-700/60 px-4 text-sm text-zinc-200 hover:border-zinc-500 sm:inline-flex"
            >
              Contact Us
            </Link>
            <Link
              href="/outfit-builder"
              className="hidden min-h-11 items-center rounded-full border border-zinc-700/60 px-4 text-sm text-zinc-200 hover:border-zinc-500 sm:inline-flex"
            >
              Outfit Builder
            </Link>
            <Link
              href="/reviews"
              className="hidden min-h-11 items-center rounded-full border border-zinc-700/60 px-4 text-sm text-zinc-200 hover:border-zinc-500 sm:inline-flex"
            >
              Reviews
            </Link>
            <Link
              href={loggedIn ? "/account/profile" : "/login"}
              className="hidden min-h-11 items-center rounded-full border border-zinc-700/60 px-4 text-sm text-zinc-200 hover:border-zinc-500 sm:inline-flex"
            >
              {loggedIn ? "My Profile" : "Login"}
            </Link>
            <Link
              href="/cart"
              aria-label={`Open cart with ${totalItems} items`}
              className="relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-zinc-700/60 px-3 text-zinc-200 hover:border-zinc-500"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9">
                <path d="M3 4h2l2.2 10.2a1 1 0 0 0 1 .8h8.8a1 1 0 0 0 1-.78L20 7H7" />
                <circle cx="10" cy="19" r="1.5" />
                <circle cx="17" cy="19" r="1.5" />
              </svg>
              <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-zinc-100 px-1 text-[10px] font-semibold text-zinc-900">
                {totalItems}
              </span>
            </Link>
          </div>
        </div>
      </div>
      {!isAdmin ? <ShippingRegionModal /> : null}
      <div
        className={`fixed inset-0 z-[60] bg-black/55 transition-opacity duration-300 md:hidden ${
          mobileMenuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setMobileMenuOpen(false)}
      />
      <div
        className={`fixed right-0 top-0 z-[70] h-full w-[84%] max-w-sm border-l border-white/10 bg-black/85 p-4 backdrop-blur-2xl transition-transform duration-300 md:hidden ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="mb-4 flex items-center justify-between pt-2">
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-400">Navigation</p>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="inline-flex min-h-10 items-center rounded-full border border-white/15 px-4 text-sm text-zinc-200"
          >
            Close
          </button>
        </div>
        <div className="grid gap-2">
          {!isAdmin ? (
            <button
              type="button"
              onClick={() => {
                try {
                  sessionStorage.removeItem("sv-shipping-region-confirmed-session");
                } catch {
                  // ignore
                }
                window.location.reload();
              }}
              className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-left text-sm font-medium text-amber-100 hover:bg-amber-500/15"
            >
              Shipping region & currency
            </button>
          ) : null}
          {categoryNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-zinc-200 hover:bg-white/10"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/cart"
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-zinc-200 hover:bg-white/10"
          >
            Cart ({totalItems})
          </Link>
          <Link
            href="/contact"
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-zinc-200 hover:bg-white/10"
          >
            Contact Us
          </Link>
          <Link
            href="/outfit-builder"
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-zinc-200 hover:bg-white/10"
          >
            Outfit Builder
          </Link>
          <Link
            href="/reviews"
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-zinc-200 hover:bg-white/10"
          >
            Reviews
          </Link>
          <Link
            href={loggedIn ? "/account/profile" : "/login"}
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-zinc-200 hover:bg-white/10"
          >
            {loggedIn ? "My Profile" : "Login"}
          </Link>
        </div>
      </div>
    </header>
    {!isAdmin ? <ShippingRegionModal /> : null}
    </>
  );
}
