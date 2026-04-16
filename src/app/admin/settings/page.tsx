"use client";

import { FormEvent, useEffect, useState } from "react";

type AdminUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
};

type PendingAdminInvite = {
  id: string;
  email: string;
  expiresAt: string;
  invitedByUserId: string | null;
  createdAt: string;
};

export default function AdminSettingsRoute() {
  const [lowStockThreshold, setLowStockThreshold] = useState(3);
  const [shippingFlatRate, setShippingFlatRate] = useState(10);
  const [currentAdminId, setCurrentAdminId] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingAdminInvite[]>([]);
  const [message, setMessage] = useState("");
  const [adminMessage, setAdminMessage] = useState("");
  const [adminError, setAdminError] = useState("");
  const [promoting, setPromoting] = useState(false);

  const loadSettings = () => {
    fetch("/api/admin/settings", { cache: "no-store", credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        setLowStockThreshold(data.lowStockThreshold ?? 3);
        setShippingFlatRate(data.shippingFlatRate ?? 10);
        setCurrentAdminId(data.currentAdminId ?? "");
        setAdmins(data.admins ?? []);
        setPendingInvites(data.pendingAdminInvites ?? []);
      });
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    await fetch("/api/admin/settings", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lowStockThreshold, shippingFlatRate }),
    });
    setMessage("Settings updated.");
    loadSettings();
  };

  const onMakeAdmin = async (event: FormEvent) => {
    event.preventDefault();
    setAdminMessage("");
    setAdminError("");
    setPromoting(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail }),
      });
      const data = await response.json();
      if (!response.ok) {
        setAdminError(data.error ?? "Unable to process admin promotion.");
        return;
      }
      setAdminMessage(data.message ?? "Admin access updated.");
      setAdminEmail("");
      loadSettings();
    } finally {
      setPromoting(false);
    }
  };

  const onRemoveAdmin = async (userId: string) => {
    setAdminMessage("");
    setAdminError("");
    const response = await fetch("/api/admin/settings", {
      method: "DELETE",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const data = await response.json();
    if (!response.ok) {
      setAdminError(data.error ?? "Unable to remove admin access.");
      return;
    }
    setAdminMessage(data.message ?? "Admin access removed.");
    loadSettings();
  };

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">Store Settings</h2>
      <form onSubmit={onSubmit} className="rounded-2xl border border-white/10 bg-black/25 p-4">
        <label className="grid gap-2 text-sm">
          <span className="text-zinc-300">Global low-stock threshold</span>
          <input
            type="number"
            value={lowStockThreshold}
            onChange={(event) => setLowStockThreshold(Number(event.target.value || 1))}
            className="rounded-lg border border-white/15 bg-black/30 px-3 py-2"
          />
        </label>
        <label className="mt-3 grid gap-2 text-sm">
          <span className="text-zinc-300">Default shipping flat rate (AUD)</span>
          <input
            type="number"
            min="0"
            step="0.5"
            value={shippingFlatRate}
            onChange={(event) => setShippingFlatRate(Number(event.target.value || 0))}
            className="rounded-lg border border-white/15 bg-black/30 px-3 py-2"
          />
        </label>
        <button className="mt-3 rounded-lg bg-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-900">Save</button>
      </form>
      {message ? <p className="text-sm text-zinc-300">{message}</p> : null}

      <section className="rounded-2xl border border-white/10 bg-black/25 p-4">
        <h3 className="text-lg font-semibold">Admin Access Management</h3>
        <p className="mt-1 text-sm text-zinc-400">
          Promote existing users instantly, or invite a new admin via secure email link.
        </p>
        <form onSubmit={onMakeAdmin} className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
          <input
            type="email"
            value={adminEmail}
            onChange={(event) => setAdminEmail(event.target.value)}
            placeholder="admin@email.com"
            required
            className="min-h-11 rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
          />
          <button
            disabled={promoting}
            className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-900 disabled:opacity-60"
          >
            {promoting ? "Processing..." : "Make / Invite Admin"}
          </button>
        </form>
        {adminMessage ? <p className="mt-2 text-sm text-emerald-300">{adminMessage}</p> : null}
        {adminError ? <p className="mt-2 text-sm text-red-300">{adminError}</p> : null}

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="text-sm font-semibold text-zinc-200">Current Admins</p>
            <div className="mt-2 space-y-2">
              {admins.length ? (
                admins.map((admin) => (
                  <div key={admin.id} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-zinc-100">
                          {admin.firstName} {admin.lastName}
                        </p>
                        <p className="text-zinc-400">{admin.email}</p>
                      </div>
                      {admin.id !== currentAdminId ? (
                        <button
                          type="button"
                          onClick={() => onRemoveAdmin(admin.id)}
                          className="rounded-md border border-red-400/30 px-2 py-1 text-xs text-red-200 hover:bg-red-500/10"
                        >
                          Remove admin
                        </button>
                      ) : (
                        <span className="rounded-md border border-white/15 px-2 py-1 text-xs text-zinc-400">
                          You
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-500">No admins found.</p>
              )}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="text-sm font-semibold text-zinc-200">Pending Admin Invites</p>
            <div className="mt-2 space-y-2">
              {pendingInvites.length ? (
                pendingInvites.map((invite) => (
                  <div key={invite.id} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm">
                    <p className="font-medium text-zinc-100">{invite.email}</p>
                    <p className="text-zinc-400">
                      Expires: {new Date(invite.expiresAt).toLocaleString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-500">No pending invites.</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}

