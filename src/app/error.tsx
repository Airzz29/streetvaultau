"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global app error", {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[55vh] w-full max-w-2xl flex-col items-center justify-center gap-4 rounded-2xl border border-white/10 bg-black/25 p-6 text-center">
      <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">StreetVault</p>
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="text-sm text-zinc-300">
        Please try again. If the issue keeps happening, refresh the page or re-open the site.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-xl border border-white/20 px-4 py-2 text-sm text-zinc-100 transition hover:bg-white/10"
      >
        Try again
      </button>
    </div>
  );
}
