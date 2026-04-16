"use client";

import { FormEvent, useEffect, useState } from "react";

type InviteState = {
  valid: boolean;
  email?: string;
  expiresAt?: string;
  error?: string;
};

export default function AdminInvitePage() {
  const [token, setToken] = useState("");
  const [ready, setReady] = useState(false);
  const [inviteState, setInviteState] = useState<InviteState>({ valid: false });
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inviteToken = params.get("token") ?? "";
    setToken(inviteToken);
    if (!inviteToken) {
      setInviteState({ valid: false, error: "Missing invite token." });
      setReady(true);
      return;
    }
    fetch(`/api/auth/admin-invite?token=${encodeURIComponent(inviteToken)}`, {
      cache: "no-store",
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          setInviteState({ valid: false, error: data.error ?? "Invite is invalid or expired." });
          return;
        }
        setInviteState({
          valid: true,
          email: data.email,
          expiresAt: data.expiresAt,
        });
      })
      .catch(() => {
        setInviteState({ valid: false, error: "Unable to verify invite right now." });
      })
      .finally(() => setReady(true));
  }, []);

  if (!ready) return null;

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/auth/admin-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          firstName,
          lastName,
          password,
          confirmPassword,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Unable to activate admin account.");
        return;
      }
      setSuccess("Admin account activated. You can now log in.");
      setPassword("");
      setConfirmPassword("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-md rounded-2xl border border-white/10 bg-black/25 p-5 backdrop-blur-xl sm:p-6">
      <h1 className="text-2xl font-semibold">Admin access setup</h1>
      {!inviteState.valid ? (
        <p className="mt-3 text-sm text-zinc-400">{inviteState.error ?? "Invite is invalid."}</p>
      ) : (
        <>
          <p className="mt-2 text-sm text-zinc-300">
            You are setting up admin access for <strong>{inviteState.email}</strong>.
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Invite expires: {inviteState.expiresAt ? new Date(inviteState.expiresAt).toLocaleString() : "N/A"}
          </p>
          <form onSubmit={onSubmit} className="mt-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                placeholder="First name"
                className="min-h-11 rounded-xl border border-white/15 bg-black/30 px-3 text-sm"
                required
              />
              <input
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                placeholder="Last name"
                className="min-h-11 rounded-xl border border-white/15 bg-black/30 px-3 text-sm"
                required
              />
            </div>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              placeholder="Create password"
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
              {loading ? "Activating..." : "Activate admin account"}
            </button>
          </form>
        </>
      )}
    </section>
  );
}
