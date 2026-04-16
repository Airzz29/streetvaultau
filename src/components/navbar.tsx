"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/cart-context";

const links = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/cart", label: "Cart" },
  { href: "/admin", label: "Ops" },
];

export function Navbar() {
  const pathname = usePathname();
  const { totalItems } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-sm font-semibold tracking-[0.26em] uppercase">
          StreetVault
        </Link>
        <nav className="flex items-center gap-5 text-sm text-zinc-300">
          {links.map((link) => {
            const isActive =
              link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={isActive ? "text-white" : "hover:text-white"}
              >
                {link.label}
                {link.href === "/cart" ? ` (${totalItems})` : ""}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
