"use client";

import { FormEvent, useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      setMessage(data.message ?? "If your email exists, a reset link was sent.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-md rounded-2xl border border-white/10 bg-black/25 p-5 backdrop-blur-xl sm:p-6">
      <h1 className="text-2xl font-semibold">Forgot password</h1>
      <p className="mt-2 text-sm text-zinc-400">Enter your account email to receive a reset link.</p>
      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          required
          placeholder="Email"
          className="min-h-11 w-full rounded-xl border border-white/15 bg-black/30 px-3 text-sm"
        />
        <button
          disabled={loading}
          className="min-h-11 w-full rounded-xl bg-zinc-100 px-4 text-sm font-semibold text-zinc-900 disabled:opacity-60"
        >
          {loading ? "Sending..." : "Send reset link"}
        </button>
      </form>
      {message ? <p className="mt-3 text-sm text-zinc-300">{message}</p> : null}
    </section>
  );
}

