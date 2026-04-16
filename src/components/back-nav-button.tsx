"use client";

import { useRouter } from "next/navigation";

type BackNavButtonProps = {
  fallbackHref?: string;
  label?: string;
  className?: string;
};

export function BackNavButton({
  fallbackHref = "/",
  label = "Back",
  className = "",
}: BackNavButtonProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== "undefined" && window.history.length > 1) {
          router.back();
          return;
        }
        router.push(fallbackHref);
      }}
      className={`inline-flex min-h-10 items-center rounded-xl border border-white/20 px-3 py-1.5 text-sm text-zinc-200 transition hover:bg-white/10 ${className}`.trim()}
    >
      ← {label}
    </button>
  );
}
