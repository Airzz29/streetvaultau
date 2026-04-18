/** Fine-grained admin UI/API access. DB null/empty column = legacy full access. */

export const ADMIN_PAGE_KEYS = [
  "dashboard",
  "products",
  "premade-fits",
  "inventory",
  "orders",
  "dropship",
  "users",
  "discounts",
  "marketing",
  "analytics",
  "contacts",
  "reviews",
  "settings",
] as const;

export type AdminPageKey = (typeof ADMIN_PAGE_KEYS)[number];

export type AdminPermissionsMap = Partial<Record<AdminPageKey, boolean>>;

export function parseAdminPermissionsJson(raw: string | null | undefined): AdminPermissionsMap | null {
  if (raw == null || raw === "") return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as AdminPermissionsMap;
  } catch {
    return null;
  }
}

/** `permissions == null` means unrestricted (full admin). */
export function hasAdminPermission(
  permissions: AdminPermissionsMap | null | undefined,
  pageKey: AdminPageKey
): boolean {
  if (permissions == null) return true;
  return permissions[pageKey] === true;
}

export function normalizePermissionsPayload(
  input: unknown
): AdminPermissionsMap | null {
  if (input === undefined) return null;
  if (input === null) return null;
  if (typeof input !== "object" || Array.isArray(input)) return {};
  const out: AdminPermissionsMap = {};
  for (const key of ADMIN_PAGE_KEYS) {
    const v = (input as Record<string, unknown>)[key];
    if (v === true) out[key] = true;
  }
  return Object.keys(out).length ? out : {};
}
