"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const categoryNavItems = [
  { href: "/clothes", label: "Shirts" },
  { href: "/pants-jeans", label: "Pants / Shorts / Jeans" },
  { href: "/shoes", label: "Shoes" },
  { href: "/hoodies", label: "Hoodies" },
  { href: "/accessories", label: "Accessories" },
  { href: "/premade-fits", label: "Premade Fits" },
  { href: "/outfit-builder", label: "Outfit Builder" },
];

type CategoryNavProps = {
  compact?: boolean;
};

export function CategoryNav({ compact = false }: CategoryNavProps) {
  const pathname = usePathname();

  return (
    <nav className="mx-auto mt-2 w-full max-w-3xl overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <ul
        className={`mx-auto flex min-w-max items-center justify-start gap-1.5 rounded-2xl border border-zinc-700/50 bg-black/30 px-2 py-1.5 backdrop-blur-xl sm:justify-center ${
          compact ? "md:min-w-0 md:flex-wrap md:justify-center" : ""
        }`}
      >
        {categoryNavItems.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`inline-flex min-h-9 items-center rounded-full px-3 py-1.5 tracking-wide transition ${
                  compact ? "text-xs" : "text-sm"
                } ${
                  active
                    ? "bg-zinc-100 text-zinc-950"
                    : "text-zinc-300 hover:bg-white/10 hover:text-zinc-100"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
