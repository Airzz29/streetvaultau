import path from "node:path";

const DEFAULT_UPLOADS_ROOT = path.join(process.cwd(), "public", "uploads");

function normalizeRoot(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return DEFAULT_UPLOADS_ROOT;
  return path.isAbsolute(trimmed) ? trimmed : path.join(process.cwd(), trimmed);
}

export function getUploadsRoot() {
  return normalizeRoot(process.env.UPLOADS_ROOT ?? "");
}

export function getUploadDirectory(kind: "products" | "reviews") {
  return path.join(getUploadsRoot(), kind);
}

export function getLegacyUploadDirectory(kind: "products" | "reviews") {
  return path.join(process.cwd(), "public", "uploads", kind);
}
