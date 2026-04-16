import { NextRequest, NextResponse } from "next/server";
import { createContactMessage } from "@/lib/store-db";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    name?: string;
    email?: string;
    phone?: string;
    subject?: string;
    message?: string;
  };
  if (!body.name || !body.email || !body.message) {
    return NextResponse.json({ error: "Name, email, and message are required." }, { status: 400 });
  }
  createContactMessage({
    name: body.name,
    email: body.email,
    phone: body.phone,
    subject: body.subject,
    message: body.message,
  });
  return NextResponse.json({ ok: true });
}

