"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    marketingOptIn: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"signup" | "verify">("signup");
  const [verifyCode, setVerifyCode] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");
  const [resendAvailableAt, setResendAvailableAt] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  const resendCooldown = resendAvailableAt
    ? Math.max(0, Math.ceil((new Date(resendAvailableAt).getTime() - now) / 1000))
    : 0;

  useEffect(() => {
    if (step !== "verify") return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [step]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Unable to create account.");
        return;
      }
      setVerificationEmail(data.email ?? form.email.trim().toLowerCase());
      setResendAvailableAt(data.resendAvailableAt ?? null);
      setStep("verify");
    } finally {
      setLoading(false);
    }
  };

  const onVerifySubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: verificationEmail, code: verifyCode }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Unable to verify email.");
        return;
      }
      router.push("/account");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const onResendCode = async () => {
    setError("");
    const response = await fetch("/api/auth/verify-email/resend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: verificationEmail }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Unable to resend code.");
      return;
    }
    setResendAvailableAt(data.resendAvailableAt ?? null);
    setNow(Date.now());
  };

  return (
    <section className="mx-auto max-w-md rounded-2xl border border-white/10 bg-black/25 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-7">
      <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">StreetVault Account</p>
      <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Create account</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Join StreetVault for faster checkout, saved details, and order tracking.
      </p>
      {step === "signup" ? (
      <form onSubmit={onSubmit} className="mt-5 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={form.firstName}
            onChange={(event) => setForm((prev) => ({ ...prev, firstName: event.target.value }))}
            placeholder="First name"
            className="min-h-11 rounded-xl border border-white/15 bg-black/30 px-3 text-sm text-zinc-100 outline-none transition focus:border-zinc-300"
            required
          />
          <input
            value={form.lastName}
            onChange={(event) => setForm((prev) => ({ ...prev, lastName: event.target.value }))}
            placeholder="Last name"
            className="min-h-11 rounded-xl border border-white/15 bg-black/30 px-3 text-sm text-zinc-100 outline-none transition focus:border-zinc-300"
            required
          />
        </div>
        <input
          value={form.email}
          onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
          type="email"
          placeholder="Email"
          className="min-h-11 w-full rounded-xl border border-white/15 bg-black/30 px-3 text-sm text-zinc-100 outline-none transition focus:border-zinc-300"
          required
        />
        <input
          value={form.password}
          onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
          type="password"
          placeholder="Password"
          className="min-h-11 w-full rounded-xl border border-white/15 bg-black/30 px-3 text-sm text-zinc-100 outline-none transition focus:border-zinc-300"
          required
        />
        <input
          value={form.confirmPassword}
          onChange={(event) => setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
          type="password"
          placeholder="Confirm password"
          className="min-h-11 w-full rounded-xl border border-white/15 bg-black/30 px-3 text-sm text-zinc-100 outline-none transition focus:border-zinc-300"
          required
        />
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input
            checked={form.marketingOptIn}
            onChange={(event) => setForm((prev) => ({ ...prev, marketingOptIn: event.target.checked }))}
            type="checkbox"
          />
          Email me about sales, drops, and special offers
        </label>
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        <button
          disabled={loading}
          className="min-h-11 w-full rounded-xl bg-zinc-100 px-4 text-sm font-semibold text-zinc-900 transition hover:bg-white disabled:opacity-60"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>
      ) : (
      <form onSubmit={onVerifySubmit} className="mt-5 space-y-3">
        <p className="text-sm text-zinc-300">
          Enter the 6-digit verification code sent to <span className="font-semibold">{verificationEmail}</span>.
        </p>
        <input
          value={verifyCode}
          onChange={(event) => setVerifyCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="6-digit code"
          className="min-h-11 w-full rounded-xl border border-white/15 bg-black/30 px-3 text-center text-lg tracking-[0.35em] text-zinc-100 outline-none transition focus:border-zinc-300"
          required
        />
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        <button
          disabled={loading || verifyCode.length !== 6}
          className="min-h-11 w-full rounded-xl bg-zinc-100 px-4 text-sm font-semibold text-zinc-900 transition hover:bg-white disabled:opacity-60"
        >
          {loading ? "Verifying..." : "Verify Email"}
        </button>
        <button
          type="button"
          onClick={onResendCode}
          disabled={resendCooldown > 0}
          className="min-h-11 w-full rounded-xl border border-white/20 px-4 text-sm font-semibold text-zinc-100 hover:bg-white/10 disabled:opacity-60"
        >
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
        </button>
      </form>
      )}
      <p className="mt-4 text-sm text-zinc-400">
        Already have an account?{" "}
        <Link href="/login" className="text-zinc-200 hover:text-white">
          Log in
        </Link>
      </p>
    </section>
  );
}

