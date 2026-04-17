import nodemailer from "nodemailer";
import { resolveAppBaseUrl } from "@/lib/app-url";

function getTransport() {
  const host = process.env.EMAIL_SMTP_HOST ?? "smtp.gmail.com";
  const port = Number(process.env.EMAIL_SMTP_PORT ?? "465");
  const user = process.env.EMAIL_SMTP_USER;
  const pass = process.env.EMAIL_SMTP_PASS;
  if (!user || !pass) {
    return null;
  }
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function toAbsoluteImageUrl(image: string, siteUrl: string) {
  const trimmed = image.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `${siteUrl}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`;
}

function toAbsoluteUrl(url?: string) {
  if (!url?.trim()) return undefined;
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const siteUrl = resolveAppBaseUrl();
  return `${siteUrl}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`;
}

function renderOrderItemsEmailTable(
  items: Array<{
    name: string;
    size?: string | null;
    quantity: number;
    unitPrice?: number;
    image?: string | null;
  }>,
  siteUrl: string
) {
  if (!items.length) return "";
  const rows = items
    .map((item) => {
      const imageUrl = item.image ? toAbsoluteImageUrl(item.image, siteUrl) : "";
      const variantLabel = item.size ? `Size ${escapeHtml(item.size)}` : "Variant selected";
      const priceLabel =
        typeof item.unitPrice === "number" ? ` · ${item.unitPrice.toFixed(2)} AUD each` : "";
      return `
      <tr>
        <td style="padding:10px;border-bottom:1px solid #27272a;vertical-align:top;">
          ${
            imageUrl
              ? `<img src="${imageUrl}" alt="${escapeHtml(item.name)}" width="64" height="64" style="display:block;border-radius:10px;border:1px solid #3f3f46;object-fit:cover;background:#111827;" />`
              : `<div style="width:64px;height:64px;border-radius:10px;border:1px solid #3f3f46;background:#111827;"></div>`
          }
        </td>
        <td style="padding:10px;border-bottom:1px solid #27272a;vertical-align:top;">
          <p style="margin:0 0 4px;font-size:14px;line-height:1.5;color:#f4f4f5;font-weight:600;">${escapeHtml(item.name)}</p>
          <p style="margin:0;font-size:12px;line-height:1.5;color:#d4d4d8;">${variantLabel} · Qty ${item.quantity}${priceLabel}</p>
        </td>
      </tr>`;
    })
    .join("");

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #3f3f46;border-radius:12px;overflow:hidden;background:#111827;margin:14px 0;">
      <tbody>${rows}</tbody>
    </table>
  `;
}

function wrapBrandEmail(params: {
  title: string;
  subtitle: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  fallbackText?: string;
  secondaryCtaLabel?: string;
  secondaryCtaUrl?: string;
}) {
  const ctaBlock =
    params.ctaLabel && params.ctaUrl
      ? `<p style="margin:24px 0 10px;">
          <a href="${params.ctaUrl}" style="display:inline-block;padding:12px 20px;border-radius:10px;background:#f4f4f5;color:#111827 !important;text-decoration:none;font-weight:700;font-size:14px;border:1px solid #d4d4d8;">
            ${params.ctaLabel}
          </a>
        </p>`
      : "";
  const secondaryCtaBlock =
    params.secondaryCtaLabel && params.secondaryCtaUrl
      ? `<p style="margin:0 0 12px;">
          <a href="${params.secondaryCtaUrl}" style="display:inline-block;padding:10px 16px;border-radius:10px;background:#18181b;color:#f4f4f5 !important;text-decoration:none;font-weight:600;font-size:13px;border:1px solid #3f3f46;">
            ${params.secondaryCtaLabel}
          </a>
        </p>`
      : "";
  const fallbackBlock =
    params.ctaUrl && params.fallbackText
      ? `<p style="margin:0 0 10px;color:#a1a1aa;font-size:13px;line-height:1.5;">${params.fallbackText}</p>
         <p style="margin:0 0 20px;word-break:break-all;">
           <a href="${params.ctaUrl}" style="color:#93c5fd;text-decoration:none;">${params.ctaUrl}</a>
         </p>`
      : "";

  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#0a0a0b;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#0a0a0b;padding:22px 10px;font-family:Arial,'Segoe UI',sans-serif;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;border:1px solid #27272a;border-radius:16px;background:#111827;overflow:hidden;">
            <tr>
              <td style="padding:22px;border-bottom:1px solid #27272a;">
                <p style="margin:0 0 8px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#a1a1aa;">StreetVault</p>
                <h1 style="margin:0;font-size:24px;line-height:1.25;color:#fafafa;font-weight:700;">${params.title}</h1>
                <p style="margin:10px 0 0;font-size:14px;line-height:1.6;color:#e4e4e7;">${params.subtitle}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:22px;">
                ${params.bodyHtml}
                ${ctaBlock}
                ${secondaryCtaBlock}
                ${fallbackBlock}
                <p style="margin:12px 0 0;color:#a1a1aa;font-size:12px;line-height:1.7;">
                  Need help? Reply to this email or use our contact page and our team will assist you.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendWelcomeEmail(params: { to: string; firstName: string }) {
  const transport = getTransport();
  const from = process.env.EMAIL_FROM ?? process.env.EMAIL_SMTP_USER;
  if (!transport || !from) return { sent: false };
  const siteUrl = resolveAppBaseUrl();
  await transport.sendMail({
    from,
    to: params.to,
    subject: "Welcome to StreetVault",
    html: wrapBrandEmail({
      title: `Welcome to StreetVault, ${params.firstName}`,
      subtitle: "Your account is now live and ready for premium streetwear drops.",
      bodyHtml:
        "<p style='margin:0 0 12px;color:#e4e4e7;font-size:14px;line-height:1.7;'>You can now track orders, save your details, and move through checkout faster.</p><p style='margin:0;color:#d4d4d8;font-size:14px;line-height:1.7;'>We will keep you updated on new releases, restocks, and special drops.</p>",
      ctaLabel: "Explore StreetVault",
      ctaUrl: `${siteUrl}/shop`,
      secondaryCtaLabel: "View My Account",
      secondaryCtaUrl: `${siteUrl}/account`,
      fallbackText: "If the button does not work, use this link:",
    }),
  });
  return { sent: true };
}

export async function sendPasswordResetEmail(params: { to: string; resetUrl: string }) {
  const transport = getTransport();
  const from = process.env.EMAIL_FROM ?? process.env.EMAIL_SMTP_USER;
  if (!transport || !from) return { sent: false };
  await transport.sendMail({
    from,
    to: params.to,
    subject: "Reset your StreetVault password",
    html: wrapBrandEmail({
      title: "Reset your password",
      subtitle: "A password reset was requested for your StreetVault account.",
      bodyHtml:
        "<p style='margin:0 0 12px;color:#e4e4e7;font-size:14px;line-height:1.7;'>Click the button below to reset your password. This secure link expires in <strong>1 hour</strong>.</p><p style='margin:0;color:#d4d4d8;font-size:14px;line-height:1.7;'>If you did not request this, you can safely ignore this email. No changes will be made unless you set a new password.</p>",
      ctaLabel: "Reset Password",
      ctaUrl: params.resetUrl,
      fallbackText: "If the button does not work, use this secure reset link:",
    }),
  });
  return { sent: true };
}

export async function sendOrderConfirmationEmail(params: {
  to: string;
  customerName?: string | null;
  orderId: string;
  items: Array<{
    name: string;
    size: string;
    quantity: number;
    unitPrice: number;
    image?: string | null;
  }>;
  totalAUD: number;
}) {
  const transport = getTransport();
  const from = process.env.EMAIL_FROM ?? process.env.EMAIL_SMTP_USER;
  if (!transport || !from) return { sent: false };
  const siteUrl = resolveAppBaseUrl();
  const orderItemsTable = renderOrderItemsEmailTable(params.items, siteUrl);
  await transport.sendMail({
    from,
    to: params.to,
    subject: `Order confirmed - #${params.orderId.slice(0, 8)}`,
    html: wrapBrandEmail({
      title: "Your order is confirmed",
      subtitle: `Thanks${params.customerName ? ` ${params.customerName}` : ""}, your StreetVault order is now confirmed.`,
      bodyHtml: `
        <p style="margin:0 0 12px;color:#e4e4e7;font-size:14px;line-height:1.7;">
          Thank you for your order. Your order has been received and will be shipped within 1-2 business days.
        </p>
        <p style="margin:0 0 12px;color:#d4d4d8;font-size:14px;line-height:1.7;">
          Order number: <strong>#${params.orderId.slice(0, 8)}</strong>
        </p>
        <p style="margin:0 0 8px;color:#e4e4e7;font-size:14px;line-height:1.7;">Items purchased:</p>
        ${orderItemsTable}
        <p style="margin:0 0 12px;color:#fafafa;font-size:15px;line-height:1.7;">
          Total: <strong>${params.totalAUD.toFixed(2)} AUD</strong>
        </p>
        <p style="margin:0;color:#d4d4d8;font-size:14px;line-height:1.7;">
          You can track updates anytime from your account under Orders.
        </p>
      `,
      ctaLabel: "View My Orders",
      ctaUrl: `${siteUrl}/account/orders`,
      fallbackText: "If the button does not work, use this link:",
    }),
  });
  return { sent: true };
}

export async function sendAdminNewOrderAlertEmail(params: {
  to: string;
  orderId: string;
  customerName?: string | null;
  customerEmail?: string | null;
  totalAUD: number;
  items: Array<{ name: string; size: string; color: string; quantity: number; image?: string | null }>;
}) {
  const transport = getTransport();
  const from = process.env.EMAIL_FROM ?? process.env.EMAIL_SMTP_USER;
  if (!transport || !from) return { sent: false };
  const siteUrl = resolveAppBaseUrl();
  const orderItemsTable = renderOrderItemsEmailTable(
    params.items.map((item) => ({
      name: `${item.name} (${item.color})`,
      size: item.size,
      quantity: item.quantity,
      image: item.image,
    })),
    siteUrl
  );
  await transport.sendMail({
    from,
    to: params.to,
    subject: `New paid order received - #${params.orderId.slice(0, 8)}`,
    html: wrapBrandEmail({
      title: "New order requires fulfillment",
      subtitle: "A paid order has been received. Please ship it as soon as possible.",
      bodyHtml: `
        <p style="margin:0 0 10px;color:#e4e4e7;font-size:14px;line-height:1.7;">
          Order number: <strong>#${params.orderId.slice(0, 8)}</strong>
        </p>
        <p style="margin:0 0 10px;color:#d4d4d8;font-size:13px;line-height:1.6;">
          Customer: ${escapeHtml(params.customerName ?? "N/A")} · ${escapeHtml(params.customerEmail ?? "N/A")}
        </p>
        <p style="margin:0 0 8px;color:#e4e4e7;font-size:14px;line-height:1.7;">Items purchased:</p>
        ${orderItemsTable}
        <p style="margin:0;color:#fafafa;font-size:15px;line-height:1.7;">
          Total paid: <strong>${params.totalAUD.toFixed(2)} AUD</strong>
        </p>
      `,
      ctaLabel: "Open Admin Orders",
      ctaUrl: `${siteUrl}/admin/orders`,
      fallbackText: "If the button does not work, use this admin link:",
    }),
  });
  return { sent: true };
}

export async function sendShippingConfirmationEmail(params: {
  to: string;
  customerName?: string | null;
  orderId: string;
  trackingNumber: string;
  items?: Array<{ name: string; size: string; quantity: number; image?: string | null }>;
}) {
  const transport = getTransport();
  const from = process.env.EMAIL_FROM ?? process.env.EMAIL_SMTP_USER;
  if (!transport || !from) return { sent: false };
  const siteUrl = resolveAppBaseUrl();
  const trackUrl = `https://auspost.com.au/mypost/track/details/${encodeURIComponent(
    params.trackingNumber
  )}`;
  const orderItemsHtml = renderOrderItemsEmailTable((params.items ?? []).slice(0, 8), siteUrl);
  await transport.sendMail({
    from,
    to: params.to,
    subject: `Your StreetVault order has shipped - #${params.orderId.slice(0, 8)}`,
    html: wrapBrandEmail({
      title: "Your order is on the way",
      subtitle: `Great news${params.customerName ? ` ${params.customerName}` : ""} - your StreetVault order has been shipped.`,
      bodyHtml: `
        <p style="margin:0 0 12px;color:#e4e4e7;font-size:14px;line-height:1.7;">
          Your order is on the way.
        </p>
        <p style="margin:0 0 12px;color:#d4d4d8;font-size:14px;line-height:1.7;">
          Order number: <strong>#${params.orderId.slice(0, 8)}</strong>
        </p>
        <p style="margin:0 0 12px;color:#d4d4d8;font-size:14px;line-height:1.7;">
          Tracking number: <strong>${params.trackingNumber}</strong>
        </p>
        <p style="margin:0 0 12px;color:#d4d4d8;font-size:14px;line-height:1.7;">
          You can use the tracking number below to follow delivery updates.
        </p>
        ${
          orderItemsHtml
            ? `<p style="margin:0 0 8px;color:#e4e4e7;font-size:14px;line-height:1.7;">Items shipped:</p>${orderItemsHtml}`
            : ""
        }
        <p style="margin:0;color:#d4d4d8;font-size:14px;line-height:1.7;">
          If you have any questions, contact us.
        </p>
      `,
      ctaLabel: "Track My Order",
      ctaUrl: trackUrl,
      fallbackText: "If the button does not work, use this tracking link:",
    }),
  });
  return { sent: true };
}

export async function sendDeliveredConfirmationEmail(params: {
  to: string;
  customerName?: string | null;
  orderId: string;
  items?: Array<{ name: string; size: string; quantity: number; image?: string | null }>;
}) {
  const transport = getTransport();
  const from = process.env.EMAIL_FROM ?? process.env.EMAIL_SMTP_USER;
  if (!transport || !from) return { sent: false };
  const siteUrl = resolveAppBaseUrl();
  const deliveredItems = renderOrderItemsEmailTable((params.items ?? []).slice(0, 8), siteUrl);
  await transport.sendMail({
    from,
    to: params.to,
    subject: `Delivered - StreetVault order #${params.orderId.slice(0, 8)}`,
    html: wrapBrandEmail({
      title: "Your order has been delivered",
      subtitle: `Delivered${params.customerName ? `, ${params.customerName}` : ""}. We hope you enjoy your order.`,
      bodyHtml: `
        <p style="margin:0 0 12px;color:#e4e4e7;font-size:14px;line-height:1.7;">
          Your order has been delivered.
        </p>
        <p style="margin:0 0 12px;color:#d4d4d8;font-size:14px;line-height:1.7;">
          Order number: <strong>#${params.orderId.slice(0, 8)}</strong>
        </p>
        ${
          deliveredItems
            ? `<p style="margin:0 0 8px;color:#e4e4e7;font-size:14px;line-height:1.7;">Delivered items:</p>${deliveredItems}`
            : ""
        }
        <p style="margin:0;color:#d4d4d8;font-size:14px;line-height:1.7;">
          We hope you enjoy your order. If you need help, contact our support team anytime.
        </p>
      `,
      ctaLabel: "View My Orders",
      ctaUrl: `${siteUrl}/account/orders`,
      secondaryCtaLabel: "Leave a Review",
      secondaryCtaUrl: `${siteUrl}/account/reviews`,
      fallbackText: "If the button does not work, use this link:",
    }),
  });
  return { sent: true };
}

export async function sendEmailVerificationCodeEmail(params: {
  to: string;
  firstName?: string | null;
  code: string;
  expiresMinutes: number;
}) {
  const transport = getTransport();
  const from = process.env.EMAIL_FROM ?? process.env.EMAIL_SMTP_USER;
  if (!transport || !from) return { sent: false };
  await transport.sendMail({
    from,
    to: params.to,
    subject: "StreetVault verification code",
    html: wrapBrandEmail({
      title: "Verify your email",
      subtitle: `Use this 6-digit code to verify your StreetVault account${params.firstName ? `, ${params.firstName}` : ""}.`,
      bodyHtml: `
        <p style="margin:0 0 12px;color:#e4e4e7;font-size:14px;line-height:1.7;">
          Enter the verification code below to activate your account.
        </p>
        <p style="margin:0 0 14px;font-size:30px;letter-spacing:0.18em;font-weight:800;color:#fafafa;">
          ${params.code}
        </p>
        <p style="margin:0;color:#d4d4d8;font-size:14px;line-height:1.7;">
          This code expires in ${params.expiresMinutes} minutes.
        </p>
      `,
    }),
  });
  return { sent: true };
}

export async function sendMarketingCampaignEmail(params: {
  to: string;
  subject: string;
  headline: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
  recipientFirstName?: string;
  productHighlight?: {
    name: string;
    image?: string | null;
    sizesInStock?: Array<{ label: string; stock: number }>;
    colorsInStock?: Array<{ label: string; stock: number }>;
  };
}) {
  const transport = getTransport();
  const from = process.env.EMAIL_FROM ?? process.env.EMAIL_SMTP_USER;
  if (!transport || !from) return { sent: false };
  const ctaUrl = toAbsoluteUrl(params.ctaUrl);
  const productImageUrl = params.productHighlight?.image
    ? toAbsoluteImageUrl(params.productHighlight.image, resolveAppBaseUrl())
    : "";
  const productBlock = params.productHighlight
    ? `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #3f3f46;border-radius:12px;background:#111827;margin:0 0 14px;">
        <tr>
          <td style="padding:12px;">
            ${
              productImageUrl
                ? `<img src="${productImageUrl}" alt="${escapeHtml(params.productHighlight.name)}" width="120" height="120" style="display:block;margin:0 auto 10px;border-radius:10px;border:1px solid #3f3f46;object-fit:cover;background:#0f172a;" />`
                : ""
            }
            <p style="margin:0 0 8px;font-size:14px;line-height:1.5;color:#f4f4f5;font-weight:700;">${escapeHtml(params.productHighlight.name)}</p>
            ${
              params.productHighlight.colorsInStock?.length
                ? `<p style="margin:0 0 6px;font-size:12px;line-height:1.5;color:#d4d4d8;"><strong>Colors in stock:</strong> ${escapeHtml(
                    params.productHighlight.colorsInStock
                      .map((entry) => `${entry.label} (${entry.stock})`)
                      .join(", ")
                  )}</p>`
                : ""
            }
            ${
              params.productHighlight.sizesInStock?.length
                ? `<p style="margin:0;font-size:12px;line-height:1.5;color:#d4d4d8;"><strong>Sizes in stock:</strong> ${escapeHtml(
                    params.productHighlight.sizesInStock
                      .map((entry) => `${entry.label} (${entry.stock})`)
                      .join(", ")
                  )}</p>`
                : ""
            }
          </td>
        </tr>
      </table>
    `
    : "";
  const greeting = params.recipientFirstName?.trim()
    ? `<p style="margin:0 0 10px;color:#e4e4e7;font-size:14px;line-height:1.7;">Hi ${escapeHtml(
        params.recipientFirstName.trim()
      )},</p>`
    : "";
  const safeBody = params.body
    .split(/\r?\n/)
    .map((line) => `<p style="margin:0 0 10px;color:#d4d4d8;font-size:14px;line-height:1.7;">${escapeHtml(line)}</p>`)
    .join("");

  await transport.sendMail({
    from,
    to: params.to,
    subject: params.subject,
    html: wrapBrandEmail({
      title: params.headline,
      subtitle: "Latest update from StreetVault.",
      bodyHtml: `${greeting}${productBlock}${safeBody}`,
      ctaLabel: params.ctaLabel,
      ctaUrl,
      fallbackText: ctaUrl ? "If the button does not work, use this link:" : undefined,
    }),
  });
  return { sent: true };
}

export async function sendAdminInviteEmail(params: {
  to: string;
  inviteUrl: string;
  expiresHours: number;
}) {
  const transport = getTransport();
  const from = process.env.EMAIL_FROM ?? process.env.EMAIL_SMTP_USER;
  if (!transport || !from) return { sent: false };
  await transport.sendMail({
    from,
    to: params.to,
    subject: "You have been invited as a StreetVault admin",
    html: wrapBrandEmail({
      title: "Admin invitation",
      subtitle: "You have been invited to access the StreetVault admin panel.",
      bodyHtml: `
        <p style="margin:0 0 12px;color:#e4e4e7;font-size:14px;line-height:1.7;">
          Click the secure link below to create your admin password and activate your admin account.
        </p>
        <p style="margin:0;color:#d4d4d8;font-size:14px;line-height:1.7;">
          This link expires in <strong>${params.expiresHours} hours</strong> and can only be used once.
        </p>
      `,
      ctaLabel: "Set Admin Password",
      ctaUrl: params.inviteUrl,
      fallbackText: "If the button does not work, use this secure link:",
    }),
  });
  return { sent: true };
}

