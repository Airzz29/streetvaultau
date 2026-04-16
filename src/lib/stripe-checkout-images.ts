type BuildStripeProductDataInput = {
  name: string;
  image: string | null | undefined;
  origin: string;
};

function isValidAbsoluteHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function resolveBaseUrl(origin: string) {
  const fromEnv = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv && isValidAbsoluteHttpUrl(fromEnv)) {
    return fromEnv;
  }
  return origin;
}

export function getStripeSafeImageUrl(
  image: string | null | undefined,
  origin: string
): string | null {
  if (!image) return null;
  const trimmed = image.trim();
  if (!trimmed) return null;

  if (isValidAbsoluteHttpUrl(trimmed)) {
    return trimmed;
  }

  const baseUrl = resolveBaseUrl(origin);
  const candidate = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  try {
    const resolved = new URL(candidate, baseUrl).toString();
    if (isValidAbsoluteHttpUrl(resolved)) {
      return resolved;
    }
    return null;
  } catch {
    return null;
  }
}

export function buildStripeProductData(input: BuildStripeProductDataInput) {
  const imageUrl = getStripeSafeImageUrl(input.image, input.origin);
  if (!imageUrl && input.image) {
    console.warn(
      `[Stripe Checkout] Omitting invalid product image for "${input.name}": ${input.image}`
    );
  }
  return imageUrl ? { name: input.name, images: [imageUrl] } : { name: input.name };
}
