import nodemailer from "nodemailer";

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

function wrapBrandEmail(params: {
  title: string;
  subtitle: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  fallbackText?: string;
}) {
  const ctaBlock =
    params.ctaLabel && params.ctaUrl
      ? `<p style="margin:24px 0 14px;">
          <a href="${params.ctaUrl}" style="display:inline-block;padding:12px 20px;border-radius:12px;background:#f4f4f5;color:#111827;text-decoration:none;font-weight:700;">
            ${params.ctaLabel}
          </a>
        </p>`
      : "";
  const fallbackBlock =
    params.ctaUrl && params.fallbackText
      ? `<p style="margin:0 0 10px;color:#a1a1aa;font-size:13px;">${params.fallbackText}</p>
         <p style="margin:0 0 20px;word-break:break-all;">
           <a href="${params.ctaUrl}" style="color:#c4b5fd;text-decoration:none;">${params.ctaUrl}</a>
         </p>`
      : "";

  return `
  <div style="margin:0;padding:24px 12px;background:#05060b;font-family:Inter,Segoe UI,Arial,sans-serif;color:#f4f4f5;">
    <div style="max-width:560px;margin:0 auto;border:1px solid rgba(255,255,255,0.12);border-radius:18px;overflow:hidden;background:linear-gradient(180deg,rgba(17,24,39,0.92),rgba(9,9,11,0.95));">
      <div style="padding:22px 22px 12px;border-bottom:1px solid rgba(255,255,255,0.08);">
        <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#a1a1aa;">StreetVault</p>
        <h1 style="margin:0;font-size:24px;line-height:1.25;color:#fafafa;">${params.title}</h1>
        <p style="margin:10px 0 0;color:#d4d4d8;font-size:14px;line-height:1.6;">${params.subtitle}</p>
      </div>
      <div style="padding:22px;">
        ${params.bodyHtml}
        ${ctaBlock}
        ${fallbackBlock}
        <p style="margin:14px 0 0;color:#a1a1aa;font-size:12px;line-height:1.6;">
          Need help? Reply to this email and our team will assist you.
        </p>
      </div>
    </div>
  </div>
  `;
}

export async function sendWelcomeEmail(params: { to: string; firstName: string }) {
  const transport = getTransport();
  const from = process.env.EMAIL_FROM ?? process.env.EMAIL_SMTP_USER;
  if (!transport || !from) return { sent: false };
  await transport.sendMail({
    from,
    to: params.to,
    subject: "Welcome to StreetVault",
    html: wrapBrandEmail({
      title: `Welcome to StreetVault, ${params.firstName}`,
      subtitle: "Your account is now live and ready for premium streetwear drops.",
      bodyHtml:
        "<p style='margin:0 0 12px;color:#e4e4e7;font-size:14px;line-height:1.7;'>You can now track orders, save your details, and move through checkout faster.</p><p style='margin:0;color:#d4d4d8;font-size:14px;line-height:1.7;'>We will keep you updated on new releases and restocks.</p>",
      ctaLabel: "Explore StreetVault",
      ctaUrl: `${process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL ?? "http://localhost:3000"}/shop`,
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
        "<p style='margin:0 0 12px;color:#e4e4e7;font-size:14px;line-height:1.7;'>Click the button below to reset your password. This link expires in <strong>1 hour</strong>.</p><p style='margin:0;color:#d4d4d8;font-size:14px;line-height:1.7;'>If you did not request this, you can safely ignore this email. No changes will be made unless you set a new password.</p>",
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
  items: Array<{ name: string; size: string; quantity: number; unitPrice: number }>;
  totalAUD: number;
}) {
  const transport = getTransport();
  const from = process.env.EMAIL_FROM ?? process.env.EMAIL_SMTP_USER;
  if (!transport || !from) return { sent: false };
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL ?? "http://localhost:3000";
  const orderLines = params.items
    .map(
      (item) =>
        `<li style="margin:0 0 8px;color:#d4d4d8;font-size:14px;line-height:1.6;">${item.name} (${item.size}) x${item.quantity} - ${item.unitPrice.toFixed(2)} AUD</li>`
    )
    .join("");
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
        <ul style="margin:0 0 12px;padding-left:18px;">
          ${orderLines}
        </ul>
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

export async function sendShippingConfirmationEmail(params: {
  to: string;
  customerName?: string | null;
  orderId: string;
  trackingNumber: string;
  items?: Array<{ name: string; size: string; quantity: number }>;
}) {
  const transport = getTransport();
  const from = process.env.EMAIL_FROM ?? process.env.EMAIL_SMTP_USER;
  if (!transport || !from) return { sent: false };
  const trackUrl = `https://auspost.com.au/mypost/track/details/${encodeURIComponent(
    params.trackingNumber
  )}`;
  const orderItemsHtml = (params.items ?? [])
    .slice(0, 6)
    .map(
      (item) =>
        `<li style="margin:0 0 8px;color:#d4d4d8;font-size:14px;line-height:1.6;">${item.name} (${item.size}) x${item.quantity}</li>`
    )
    .join("");
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
            ? `<p style="margin:0 0 8px;color:#e4e4e7;font-size:14px;line-height:1.7;">Items shipped:</p>
               <ul style="margin:0 0 12px;padding-left:18px;">
                 ${orderItemsHtml}
               </ul>`
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
}) {
  const transport = getTransport();
  const from = process.env.EMAIL_FROM ?? process.env.EMAIL_SMTP_USER;
  if (!transport || !from) return { sent: false };
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL ?? "http://localhost:3000";
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
        <p style="margin:0;color:#d4d4d8;font-size:14px;line-height:1.7;">
          We hope you enjoy your order. If you need help, contact our support team anytime.
        </p>
      `,
      ctaLabel: "View My Orders",
      ctaUrl: `${siteUrl}/account/orders`,
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

