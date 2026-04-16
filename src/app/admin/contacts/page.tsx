"use client";

import { useEffect, useState } from "react";

type Contact = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  status: "unfinished" | "priority" | "finished";
  sourceType: "general" | "order";
  orderId: string | null;
  internalNote: string | null;
  createdAt: string;
};

export default function AdminContactsRoute() {
  const [status, setStatus] = useState<"unfinished" | "priority" | "finished">("unfinished");
  const [contacts, setContacts] = useState<Contact[]>([]);

  const load = async (nextStatus: "unfinished" | "priority" | "finished") => {
    const response = await fetch(`/api/admin/contacts?status=${nextStatus}`, {
      cache: "no-store",
      credentials: "include",
    });
    const data = await response.json();
    setContacts(data.contacts ?? []);
  };

  useEffect(() => {
    load(status);
  }, [status]);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-2xl font-semibold">Contacts Inbox</h2>
        <div className="flex gap-2">
          <button onClick={() => setStatus("unfinished")} className={`rounded-lg border px-3 py-2 text-xs ${status === "unfinished" ? "border-zinc-100 bg-zinc-100 text-zinc-900" : "border-white/15 text-zinc-300"}`}>Unfinished</button>
          <button onClick={() => setStatus("priority")} className={`rounded-lg border px-3 py-2 text-xs ${status === "priority" ? "border-zinc-100 bg-zinc-100 text-zinc-900" : "border-white/15 text-zinc-300"}`}>Priority</button>
          <button onClick={() => setStatus("finished")} className={`rounded-lg border px-3 py-2 text-xs ${status === "finished" ? "border-zinc-100 bg-zinc-100 text-zinc-900" : "border-white/15 text-zinc-300"}`}>Finished</button>
        </div>
      </div>
      <div className="space-y-3">
        {contacts.map((contact) => (
          <article key={contact.id} className="rounded-2xl border border-white/10 bg-black/25 p-4">
            <p className="font-semibold">{contact.name} · {contact.email}</p>
            {contact.phone ? <p className="text-xs text-zinc-400">Phone: {contact.phone}</p> : null}
            <p className="mt-1 text-xs text-zinc-500">
              {contact.sourceType === "order"
                ? `Priority order query${contact.orderId ? ` · Order #${contact.orderId.slice(0, 8)}` : ""}`
                : "General inquiry"}
            </p>
            {contact.subject ? <p className="mt-1 text-sm text-zinc-300">{contact.subject}</p> : null}
            <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-400">{contact.message}</p>
            <p className="mt-2 text-xs text-zinc-500">{new Date(contact.createdAt).toLocaleString()}</p>
            <button
              onClick={async () => {
                await fetch("/api/admin/contacts", {
                  method: "PATCH",
                  credentials: "include",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    id: contact.id,
                    status: contact.status === "finished" ? "unfinished" : "finished",
                  }),
                });
                await load(status);
              }}
              className="mt-3 rounded-lg border border-white/20 px-3 py-2 text-xs hover:bg-white/10"
            >
              {contact.status === "finished" ? "Mark Unfinished" : "Mark Finished"}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

