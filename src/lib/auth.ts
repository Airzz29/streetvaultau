import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";
import {
  createSession,
  deleteSession,
  getSession,
  getUserById,
  touchSession,
  updateUserLastActive,
} from "@/lib/store-db";

const AUTH_COOKIE_NAME = "sv_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14;
const SESSION_TOUCH_INTERVAL_MS = 5 * 60 * 1000;
const USER_LAST_ACTIVE_UPDATE_INTERVAL_MS = 5 * 60 * 1000;

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("Missing AUTH_SECRET. Set a long random secret in environment variables.");
  }
  return new TextEncoder().encode(secret);
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, hashed: string) {
  const [salt, stored] = hashed.split(":");
  if (!salt || !stored) return false;
  const derived = scryptSync(password, salt, 64).toString("hex");
  return timingSafeEqual(Buffer.from(derived, "hex"), Buffer.from(stored, "hex"));
}

function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createRawResetToken() {
  const raw = randomBytes(32).toString("hex");
  return { raw, hash: hashResetToken(raw) };
}

export function hashProvidedResetToken(token: string) {
  return hashResetToken(token);
}

export async function createUserSession(userId: string, role: "customer" | "admin") {
  const sessionId = randomBytes(24).toString("hex");
  const nowSeconds = Math.floor(Date.now() / 1000);
  const expSeconds = nowSeconds + SESSION_TTL_SECONDS;
  const expiresAt = new Date(expSeconds * 1000).toISOString();
  const userAgent = headers().get("user-agent");
  const forwardedFor = headers().get("x-forwarded-for");
  const ipAddress = forwardedFor ? forwardedFor.split(",")[0]?.trim() : null;
  createSession({ sessionId, userId, expiresAt, userAgent, ipAddress });
  const jwt = await new SignJWT({ sid: sessionId, uid: userId, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(nowSeconds)
    .setExpirationTime(expSeconds)
    .sign(getAuthSecret());

  cookies().set(AUTH_COOKIE_NAME, jwt, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearUserSessionCookie() {
  cookies().set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function logoutCurrentSession() {
  const token = cookies().get(AUTH_COOKIE_NAME)?.value;
  if (token) {
    try {
      const verified = await jwtVerify(token, getAuthSecret());
      const sessionId = String(verified.payload.sid ?? "");
      if (sessionId) {
        deleteSession(sessionId);
      }
    } catch {
      // Ignore invalid cookie and just clear it.
    }
  }
  clearUserSessionCookie();
}

export async function getCurrentSession() {
  const token = cookies().get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const verified = await jwtVerify(token, getAuthSecret());
    const sessionId = String(verified.payload.sid ?? "");
    if (!sessionId) return null;
    const session = getSession(sessionId);
    if (!session) {
      clearUserSessionCookie();
      return null;
    }
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      deleteSession(sessionId);
      clearUserSessionCookie();
      return null;
    }
    const now = Date.now();
    const shouldTouchSession =
      now - new Date(session.lastSeenAt).getTime() >= SESSION_TOUCH_INTERVAL_MS;
    const lastActiveAt = session.user.lastActiveAt ? new Date(session.user.lastActiveAt).getTime() : 0;
    const shouldUpdateUserLastActive = now - lastActiveAt >= USER_LAST_ACTIVE_UPDATE_INTERVAL_MS;
    if (shouldTouchSession) {
      touchSession(sessionId);
    }
    if (shouldUpdateUserLastActive) {
      updateUserLastActive(session.user.id);
    }
    return session;
  } catch {
    clearUserSessionCookie();
    return null;
  }
}

export async function requireUser() {
  const session = await getCurrentSession();
  if (!session) return null;
  return getUserById(session.user.id);
}

export async function requireAdmin() {
  const session = await getCurrentSession();
  if (!session || session.user.role !== "admin") return null;
  return session.user;
}

