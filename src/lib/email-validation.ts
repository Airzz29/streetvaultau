const DISPOSABLE_DOMAINS = new Set(
  [
    "mailinator.com",
    "10minutemail.com",
    "tempmail.com",
    "temp-mail.org",
    "guerrillamail.com",
    "yopmail.com",
    "sharklasers.com",
    "throwawaymail.com",
    "getnada.com",
    "dispostable.com",
  ].map((domain) => domain.toLowerCase())
);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateSignupEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(normalized)) {
    return { ok: false as const, message: "Enter a valid email address." };
  }
  const [, domain = ""] = normalized.split("@");
  const blockedByDefault = DISPOSABLE_DOMAINS.has(domain);
  const blockedByEnv = (process.env.BLOCKED_EMAIL_DOMAINS ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .includes(domain);
  if (blockedByDefault || blockedByEnv) {
    return {
      ok: false as const,
      message: "Disposable or temporary email addresses are not allowed.",
    };
  }
  return { ok: true as const, email: normalized };
}

