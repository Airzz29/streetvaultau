import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/auth";
import { listContactMessages, updateContactMessage } from "@/lib/store-db";

export async function GET(request: NextRequest) {
  const admin = await requireAdminPermission("contacts");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const status = request.nextUrl.searchParams.get("status") as
    | "unfinished"
    | "priority"
    | "finished"
    | null;
  const contacts = status ? listContactMessages(status) : listContactMessages();
  return NextResponse.json({ contacts });
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdminPermission("contacts");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as {
    id?: string;
    status?: "unfinished" | "priority" | "finished";
    internalNote?: string | null;
  };
  if (!body.id) return NextResponse.json({ error: "Contact id is required." }, { status: 400 });
  updateContactMessage(body.id, { status: body.status, internalNote: body.internalNote ?? null });
  return NextResponse.json({ ok: true });
}

