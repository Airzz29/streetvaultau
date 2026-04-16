"use client";

import { FormEvent, useEffect, useState } from "react";

type ProfileState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  marketingOptIn: boolean;
};

export default function AccountProfilePage() {
  const [profile, setProfile] = useState<ProfileState>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    marketingOptIn: false,
  });
  const [message, setMessage] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    fetch("/api/account/profile")
      .then((response) => response.json())
      .then((data) => {
        if (data.profile) {
          setProfile({
            firstName: data.profile.firstName ?? "",
            lastName: data.profile.lastName ?? "",
            email: data.profile.email ?? "",
            phone: data.profile.phone ?? "",
            marketingOptIn: Boolean(data.profile.marketingOptIn),
          });
        }
      });
  }, []);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    const response = await fetch("/api/account/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "Unable to update profile.");
      return;
    }
    setMessage("Profile updated.");
  };

  const onPasswordSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    const response = await fetch("/api/account/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...profile,
        currentPassword,
        newPassword,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "Unable to update password.");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setMessage("Password updated.");
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-black/25 p-4 sm:p-5">
      <h2 className="text-xl font-semibold">Profile settings</h2>
      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={profile.firstName}
            onChange={(event) => setProfile((prev) => ({ ...prev, firstName: event.target.value }))}
            className="min-h-11 rounded-xl border border-white/15 bg-black/30 px-3 text-sm"
            placeholder="First name"
          />
          <input
            value={profile.lastName}
            onChange={(event) => setProfile((prev) => ({ ...prev, lastName: event.target.value }))}
            className="min-h-11 rounded-xl border border-white/15 bg-black/30 px-3 text-sm"
            placeholder="Last name"
          />
        </div>
        <input
          value={profile.email}
          disabled
          className="min-h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-zinc-400"
        />
        <input
          value={profile.phone}
          onChange={(event) => setProfile((prev) => ({ ...prev, phone: event.target.value }))}
          className="min-h-11 w-full rounded-xl border border-white/15 bg-black/30 px-3 text-sm"
          placeholder="Phone (optional)"
        />
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input
            checked={profile.marketingOptIn}
            onChange={(event) =>
              setProfile((prev) => ({ ...prev, marketingOptIn: event.target.checked }))
            }
            type="checkbox"
          />
          Email me about sales, drops, and special offers
        </label>
        <button className="min-h-11 rounded-xl bg-zinc-100 px-4 text-sm font-semibold text-zinc-900">
          Save profile
        </button>
      </form>
      <form onSubmit={onPasswordSubmit} className="mt-5 space-y-3 rounded-xl border border-white/10 bg-black/20 p-3">
        <p className="text-sm font-semibold">Password settings</p>
        <input
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          type="password"
          className="min-h-11 w-full rounded-xl border border-white/15 bg-black/30 px-3 text-sm"
          placeholder="Current password"
        />
        <input
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          type="password"
          className="min-h-11 w-full rounded-xl border border-white/15 bg-black/30 px-3 text-sm"
          placeholder="New password (min 8 chars)"
        />
        <button className="min-h-11 rounded-xl border border-white/20 px-4 text-sm font-semibold">
          Update password
        </button>
      </form>
      {message ? <p className="mt-3 text-sm text-zinc-300">{message}</p> : null}
    </section>
  );
}

