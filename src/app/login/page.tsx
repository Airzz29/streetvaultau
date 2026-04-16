"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [nextPath, setNextPath] = useState("/account");
  const [loginReason, setLoginReason] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Login failed.");
        return;
      }
      router.push(nextPath || "/account");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next");
    const reason = params.get("reason");
    if (next && next.startsWith("/")) {
      setNextPath(next);
    }
    if (reason === "add_to_cart") {
      setLoginReason("You need to log in to add items to your cart.");
    }
  }, []);

  return (
    <section className="mx-auto max-w-md rounded-2xl border border-white/10 bg-black/25 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-7">
      <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">StreetVault Account</p>
      <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Log in</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Access your StreetVault account to shop, manage orders, and save your details.
      </p>
      {loginReason ? (
        <p className="mt-2 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          {loginReason}
        </p>
      ) : null}
      <form onSubmit={onSubmit} className="mt-5 space-y-3">
        <label className="grid gap-1.5 text-xs text-zinc-400">
          <span>Email</span>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            placeholder="you@example.com"
            className="min-h-11 w-full rounded-xl border border-white/15 bg-black/30 px-3 text-sm text-zinc-100 outline-none ring-0 transition focus:border-zinc-300"
            required
          />
        </label>
        <label className="grid gap-1.5 text-xs text-zinc-400">
          <span>Password</span>
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            placeholder="Enter your password"
            className="min-h-11 w-full rounded-xl border border-white/15 bg-black/30 px-3 text-sm text-zinc-100 outline-none ring-0 transition focus:border-zinc-300"
            required
          />
        </label>
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        <button
          disabled={loading}
          className="min-h-11 w-full rounded-xl bg-zinc-100 px-4 text-sm font-semibold text-zinc-900 transition hover:bg-white disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>
      <div className="mt-5 grid gap-2 text-sm">
        <Link
          href="/signup"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/15 px-4 font-medium text-zinc-100 transition hover:bg-white/10"
        >
          New here? Sign up
        </Link>
        <Link href="/forgot-password" className="text-zinc-200 hover:text-white">
          Forgot password
        </Link>
      </div>
    </section>
  );
}

