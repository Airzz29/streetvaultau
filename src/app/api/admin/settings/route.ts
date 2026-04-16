import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "node:crypto";
import {
  createAdminInvite,
  deletePendingAdminInvitesByEmail,
  getActiveAdminInviteByEmail,
  getStoreSettings,
  getUserByEmail,
  listAdminUsers,
  listPendingAdminInvites,
  promoteUserToAdminByEmail,
  setUserRole,
  updateStoreSettings,
} from "@/lib/store-db";
import { requireAdmin } from "@/lib/auth";
import { sendAdminInviteEmail } from "@/lib/email";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({
    currentAdminId: admin.id,
    ...getStoreSettings(),
    admins: listAdminUsers().map((user) => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt,
    })),
    pendingAdminInvites: listPendingAdminInvites(),
  });
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as {
    lowStockThreshold: number;
    shippingFlatRate: number;
  };
  const settings = updateStoreSettings({
    lowStockThreshold: Math.max(1, Number(body.lowStockThreshold ?? 3)),
    shippingFlatRate: Math.max(0, Number(body.shippingFlatRate ?? 10)),
  });
  return NextResponse.json(settings);
}

type PromoteAdminBody = { email?: string };

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as PromoteAdminBody;
  const email = body.email?.trim().toLowerCase() ?? "";
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const existing = getUserByEmail(email);
  if (existing) {
    if (existing.role === "admin") {
      return NextResponse.json({
        ok: true,
        mode: "existing_admin",
        message: "User is already an admin.",
      });
    }
    promoteUserToAdminByEmail(email);
    return NextResponse.json({
      ok: true,
      mode: "promoted_existing_user",
      message: "User has been promoted to admin.",
    });
  }

  const activeInvite = getActiveAdminInviteByEmail(email);
  if (activeInvite) {
    return NextResponse.json(
      {
        error: "An admin invite is already pending for this email.",
      },
      { status: 409 }
    );
  }

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const expiresHours = 24;
  const expiresAt = new Date(Date.now() + expiresHours * 60 * 60 * 1000).toISOString();
  createAdminInvite({
    email,
    tokenHash,
    expiresAt,
    invitedByUserId: admin.id,
  });
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL ?? "http://localhost:3000";
  const inviteUrl = `${baseUrl}/admin-invite?token=${encodeURIComponent(rawToken)}`;
  const emailResult = await sendAdminInviteEmail({ to: email, inviteUrl, expiresHours });
  if (!emailResult.sent) {
    deletePendingAdminInvitesByEmail(email);
    return NextResponse.json(
      { error: "Invite was created but email delivery is not configured." },
      { status: 500 }
    );
  }
  return NextResponse.json({
    ok: true,
    mode: "invited_new_admin",
    message: "Admin invitation sent.",
  });
}

type RemoveAdminBody = { userId?: string };

export async function DELETE(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as RemoveAdminBody;
  const targetUserId = body.userId?.trim() ?? "";
  if (!targetUserId) {
    return NextResponse.json({ error: "Missing user id." }, { status: 400 });
  }
  if (targetUserId === admin.id) {
    return NextResponse.json({ error: "You cannot remove your own admin access." }, { status: 400 });
  }

  const updated = setUserRole(targetUserId, "customer");
  if (!updated) {
    return NextResponse.json({ error: "Admin user not found." }, { status: 404 });
  }
  return NextResponse.json({
    ok: true,
    message: "Admin access removed.",
  });
}
