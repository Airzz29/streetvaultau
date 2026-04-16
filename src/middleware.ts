import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const AUTH_COOKIE_NAME = "sv_session";

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

async function readSessionPayload(token: string) {
  const secret = getAuthSecret();
  if (!secret) return null;
  try {
    const verified = await jwtVerify(token, secret);
    return verified.payload as { role?: string };
  } catch {
    return null;
  }
}

async function resolveAdminSession(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return { isLoggedIn: false, isAdmin: false };
  const payload = await readSessionPayload(token);
  if (!payload) return { isLoggedIn: false, isAdmin: false };
  const isAdmin = payload.role === "admin";
  return { isLoggedIn: true, isAdmin };
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const payload = token ? await readSessionPayload(token) : null;
  const isLoggedIn = Boolean(payload);

  if (pathname.startsWith("/api/admin") || pathname.startsWith("/admin")) {
    const strict = await resolveAdminSession(request);

    if (pathname.startsWith("/api/admin")) {
      if (!strict.isAdmin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.next();
    }

    if (pathname === "/admin/login") {
      if (strict.isAdmin) {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      }
      return NextResponse.next();
    }

    if (!strict.isAdmin) {
      return NextResponse.redirect(
        new URL(`/admin/login?next=${encodeURIComponent(pathname + search)}`, request.url)
      );
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/account")) {
    if (!isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/checkout")) {
    if (!isLoggedIn) {
      return NextResponse.json({ error: "Login required before checkout." }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/account")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(
        new URL(`/login?next=${encodeURIComponent(pathname + search)}`, request.url)
      );
    }
  }

  if (pathname === "/checkout") {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login?next=%2Fcheckout", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/account/:path*",
    "/checkout",
    "/api/admin/:path*",
    "/api/account/:path*",
    "/api/checkout/:path*",
  ],
};

