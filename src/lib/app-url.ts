import { NextRequest } from "next/server";

function normalizeUrl(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export function resolveAppBaseUrl(request?: NextRequest) {
  const fromEnv =
    process.env.APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL ?? "";
  if (fromEnv.trim()) {
    return normalizeUrl(fromEnv.trim());
  }
  if (request) {
    return normalizeUrl(request.nextUrl.origin);
  }
  return "http://localhost:3000";
}
