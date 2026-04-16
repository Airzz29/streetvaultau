"use client";

import { FormEvent, useEffect, useState } from "react";

export default function ResetPasswordPage() {
  const [token, setToken] = useState("");
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("token") ?? "");
    setReady(true);
  }, []);

  if (!ready) return null;

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Unable to reset password.");
        return;
      }
      setSuccess("Password updated. You can now log in.");
      setPassword("");
      setConfirmPassword("");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <section className="mx-auto max-w-md rounded-2xl border border-white/10 bg-black/25 p-5 backdrop-blur-xl sm:p-6">
        <h1 className="text-2xl font-semibold">Invalid reset link</h1>
        <p className="mt-2 text-sm text-zinc-400">This password reset link is missing or malformed.</p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-md rounded-2xl border border-white/10 bg-black/25 p-5 backdrop-blur-xl sm:p-6">
      <h1 className="text-2xl font-semibold">Reset password</h1>
      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          placeholder="New password"
          className="min-h-11 w-full rounded-xl border border-white/15 bg-black/30 px-3 text-sm"
          required
        />
        <input
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          type="password"
          placeholder="Confirm password"
          className="min-h-11 w-full rounded-xl border border-white/15 bg-black/30 px-3 text-sm"
          required
        />
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        {success ? <p className="text-sm text-emerald-300">{success}</p> : null}
        <button
          disabled={loading}
          className="min-h-11 w-full rounded-xl bg-zinc-100 px-4 text-sm font-semibold text-zinc-900 disabled:opacity-60"
        >
          {loading ? "Updating..." : "Update password"}
        </button>
      </form>
    </section>
  );
}

