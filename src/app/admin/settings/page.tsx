"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { AdminPageKey } from "@/lib/admin-permissions";
import { ADMIN_PAGE_KEYS } from "@/lib/admin-permissions";

type AdminPermissionsState = Partial<Record<AdminPageKey, boolean>> | null;

type AdminUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  adminPermissions?: AdminPermissionsState;
};

type PendingAdminInvite = {
  id: string;
  email: string;
  expiresAt: string;
  invitedByUserId: string | null;
  createdAt: string;
};

const PAGE_LABELS: Record<AdminPageKey, string> = {
  dashboard: "Dashboard",
  products: "Products & uploads",
  "premade-fits": "Premade fits",
  inventory: "Inventory",
  orders: "Orders (local)",
  dropship: "Dropship",
  users: "Users",
  discounts: "Discounts",
  marketing: "Marketing",
  analytics: "Analytics",
  contacts: "Contacts",
  reviews: "Reviews",
  settings: "Store settings",
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
  const [promoteFullAccess, setPromoteFullAccess] = useState(true);
  const [promoteDraft, setPromoteDraft] = useState<Partial<Record<AdminPageKey, boolean>>>(() => {
    const seed: Partial<Record<AdminPageKey, boolean>> = {};
    for (const key of ADMIN_PAGE_KEYS) seed[key] = false;
    return seed;
  });
  const [permEditorFor, setPermEditorFor] = useState<string | null>(null);
  const [permEditorFull, setPermEditorFull] = useState(true);
  const [permEditorDraft, setPermEditorDraft] = useState<Partial<Record<AdminPageKey, boolean>>>(() => {
    const seed: Partial<Record<AdminPageKey, boolean>> = {};
    for (const key of ADMIN_PAGE_KEYS) seed[key] = false;
    return seed;
  });
  const [permSaving, setPermSaving] = useState(false);

  const promotePayload = useMemo(() => {
    if (promoteFullAccess) return undefined;
    return promoteDraft;
  }, [promoteFullAccess, promoteDraft]);

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
        body: JSON.stringify({
          email: adminEmail,
          adminPermissions: promotePayload,
        }),
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

  const openPermEditor = (admin: AdminUser) => {
    setPermEditorFor(admin.id);
    const unrestricted = admin.adminPermissions == null;
    setPermEditorFull(unrestricted);
    const next: Partial<Record<AdminPageKey, boolean>> = {};
    for (const key of ADMIN_PAGE_KEYS) {
      next[key] = unrestricted ? false : admin.adminPermissions?.[key] === true;
    }
    setPermEditorDraft(next);
  };

  const savePermEditor = async () => {
    if (!permEditorFor || permEditorFor === currentAdminId) return;
    setPermSaving(true);
    setAdminError("");
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: permEditorFor,
          adminPermissions: permEditorFull ? null : permEditorDraft,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setAdminError(data.error ?? "Unable to update permissions.");
        return;
      }
      setAdminMessage("Permissions updated.");
      setPermEditorFor(null);
      loadSettings();
    } finally {
      setPermSaving(false);
    }
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
          Promote existing users instantly, or invite a new admin via secure email link. Email invites become full-access
          admins until you restrict them here.
        </p>
        <form onSubmit={onMakeAdmin} className="mt-3 space-y-3">
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
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
          </div>
          <label className="flex items-start gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={promoteFullAccess}
              onChange={(event) => setPromoteFullAccess(event.target.checked)}
              className="mt-1"
            />
            <span>Full admin access (all sections). Uncheck to choose individual pages below.</span>
          </label>
          {!promoteFullAccess ? (
            <div className="grid gap-2 rounded-xl border border-white/10 bg-black/20 p-3 sm:grid-cols-2">
              {ADMIN_PAGE_KEYS.map((key) => (
                <label key={key} className="flex items-center gap-2 text-xs text-zinc-300">
                  <input
                    type="checkbox"
                    checked={promoteDraft[key] === true}
                    onChange={(event) =>
                      setPromoteDraft((prev) => ({ ...prev, [key]: event.target.checked }))
                    }
                  />
                  {PAGE_LABELS[key]}
                </label>
              ))}
            </div>
          ) : null}
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
                        <p className="mt-1 text-[11px] text-zinc-500">
                          {admin.adminPermissions == null ? "Full access (all sections)" : "Restricted permissions"}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {admin.id !== currentAdminId ? (
                          <>
                            <button
                              type="button"
                              onClick={() => openPermEditor(admin)}
                              className="rounded-md border border-white/20 px-2 py-1 text-xs text-zinc-200 hover:bg-white/10"
                            >
                              Permissions
                            </button>
                            <button
                              type="button"
                              onClick={() => onRemoveAdmin(admin.id)}
                              className="rounded-md border border-red-400/30 px-2 py-1 text-xs text-red-200 hover:bg-red-500/10"
                            >
                              Remove admin
                            </button>
                          </>
                        ) : (
                          <span className="rounded-md border border-white/15 px-2 py-1 text-xs text-zinc-400">
                            You
                          </span>
                        )}
                      </div>
                    </div>
                    {permEditorFor === admin.id ? (
                      <div className="mt-3 space-y-3 border-t border-white/10 pt-3">
                        <label className="flex items-start gap-2 text-xs text-zinc-300">
                          <input
                            type="checkbox"
                            checked={permEditorFull}
                            onChange={(event) => setPermEditorFull(event.target.checked)}
                            className="mt-0.5"
                          />
                          <span>Full access (all sections)</span>
                        </label>
                        {!permEditorFull ? (
                          <div className="grid gap-2 sm:grid-cols-2">
                            {ADMIN_PAGE_KEYS.map((key) => (
                              <label key={key} className="flex items-center gap-2 text-[11px] text-zinc-300">
                                <input
                                  type="checkbox"
                                  checked={permEditorDraft[key] === true}
                                  onChange={(event) =>
                                    setPermEditorDraft((prev) => ({ ...prev, [key]: event.target.checked }))
                                  }
                                />
                                {PAGE_LABELS[key]}
                              </label>
                            ))}
                          </div>
                        ) : null}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={permSaving}
                            onClick={() => void savePermEditor()}
                            className="rounded-md bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-900 disabled:opacity-50"
                          >
                            {permSaving ? "Saving..." : "Save permissions"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setPermEditorFor(null)}
                            className="rounded-md border border-white/20 px-3 py-1.5 text-xs text-zinc-200"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : null}
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
                    <p className="text-zinc-400">Expires: {new Date(invite.expiresAt).toLocaleString()}</p>
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
