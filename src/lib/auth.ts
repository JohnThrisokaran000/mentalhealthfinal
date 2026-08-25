import { randomBytes, scryptSync, timingSafeEqual, createHash } from "crypto";
import { cookies } from "next/headers";
import { db } from "./db";
import { hasPermission as hasPerm } from "./constants";
import type { Permission, Role, SafeUser } from "./types";
import { logAudit } from "./audit";
import { headers } from "next/headers";
import { ApiRequestError } from "@/lib/api-shared";

// ---------------------------------------------------------------------------
// Password hashing — scrypt (Node built-in, no external deps), Argon2-equivalent
// strength. Format: scrypt$<saltHex>$<hashHex>$<N>$<r>$<p>
// ---------------------------------------------------------------------------

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LEN = 64;

export function hashPassword(plain: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(plain, salt, KEY_LEN, {
    N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P,
    maxmem: 128 * 1024 * 1024,
  });
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}`;
}

export function verifyPassword(plain: string, stored: string): boolean {
  try {
    const parts = stored.split("$");
    if (parts.length !== 6 || parts[0] !== "scrypt") return false;
    const salt = Buffer.from(parts[1], "hex");
    const storedHash = Buffer.from(parts[2], "hex");
    const N = parseInt(parts[3], 10);
    const r = parseInt(parts[4], 10);
    const p = parseInt(parts[5], 10);
    const hash = scryptSync(plain, salt, storedHash.length, {
      N, r, p, maxmem: 128 * 1024 * 1024,
    });
    if (hash.length !== storedHash.length) return false;
    return timingSafeEqual(hash, storedHash);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Session tokens — random 32-byte token, stored hashed in DB, signed cookie.
// ---------------------------------------------------------------------------

export const SESSION_COOKIE = "sw_session";
const SESSION_TTL_DAYS = 7;

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const h = await headers();
  const ua = h.get("user-agent") ?? undefined;
  const ip = h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? undefined;
  const ipHash = ip ? hashToken(ip).slice(0, 32) : null;
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 86400000);
  await db.session.create({
    data: { userId, tokenHash, userAgent: ua?.slice(0, 255), ipHash, expiresAt },
  });
  const c = await cookies();
  c.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
  return token;
}

export async function destroySession(token: string): Promise<void> {
  const tokenHash = hashToken(token);
  await db.session.updateMany({
    where: { tokenHash },
    data: { revokedAt: new Date() },
  });
  const c = await cookies();
  c.delete(SESSION_COOKIE);
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// ---------------------------------------------------------------------------
// Current user resolution (from session cookie). Returns null if absent/invalid.
// ---------------------------------------------------------------------------

export async function getCurrentUser(): Promise<{ user: SafeUser; dbUser: import("@prisma/client").User } | null> {
  const c = await cookies();
  const token = c.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const tokenHash = hashToken(token);
  const session = await db.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  });
  if (!session || session.revokedAt || session.expiresAt < new Date()) {
    return null;
  }
  // light-touch active tracking
  if (!session.user.lastActiveAt || Date.now() - session.user.lastActiveAt.getTime() > 60000) {
    await db.user.update({ where: { id: session.user.id }, data: { lastActiveAt: new Date() } });
  }
  return { user: toSafeUser(session.user), dbUser: session.user };
}

export function toSafeUser(u: import("@prisma/client").User): SafeUser {
  return {
    id: u.id, email: u.email, name: u.name, serviceNumber: u.serviceNumber,
    unit: u.unit, rank: u.rank, role: u.role as Role,
    status: u.status as SafeUser["status"], firstLogin: u.firstLogin,
    onboardingComplete: u.onboardingComplete, emailVerified: u.emailVerified,
    mfaEnabled: u.mfaEnabled, lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
    createdAt: u.createdAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Require auth + optional permission. Throws ApiRequestError on failure.
// Every sensitive endpoint must call requirePermission(...) — RBAC is enforced
// here, never only in the UI.
// ---------------------------------------------------------------------------

export async function requireAuth(): Promise<{ user: SafeUser; dbUser: import("@prisma/client").User }> {
  const cur = await getCurrentUser();
  if (!cur) throw new ApiRequestError("Authentication required", 401, "UNAUTHENTICATED");
  return cur;
}

export async function requirePermission(perm: Permission): Promise<{ user: SafeUser; dbUser: import("@prisma/client").User }> {
  const { user, dbUser } = await requireAuth();
  if (!hasPerm(user.role, perm)) {
    await logAudit({
      actorId: user.id,
      action: "unauthorized_access_attempt",
      targetType: "Permission",
      targetId: perm,
      metadata: { path: (await headers()).get("x-invoke-path") ?? undefined },
    });
    throw new ApiRequestError("You do not have permission to perform this action.", 403, "FORBIDDEN");
  }
  return { user, dbUser };
}

// Account lockout (rate-limiting / brute-force defense)
const MAX_FAILED = 5;
const LOCK_MINUTES = 15;

export async function recordFailedLogin(email: string): Promise<void> {
  const u = await db.user.findUnique({ where: { email } });
  if (!u) return;
  const attempts = u.failedLoginAttempts + 1;
  const locked = attempts >= MAX_FAILED;
  await db.user.update({
    where: { id: u.id },
    data: {
      failedLoginAttempts: attempts,
      lockedUntil: locked ? new Date(Date.now() + LOCK_MINUTES * 60000) : u.lockedUntil,
    },
  });
}

export async function clearFailedLogin(userId: string): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: { failedLoginAttempts: 0, lockedUntil: null },
  });
}

export function isLocked(u: import("@prisma/client").User): boolean {
  return !!u.lockedUntil && u.lockedUntil > new Date();
}
