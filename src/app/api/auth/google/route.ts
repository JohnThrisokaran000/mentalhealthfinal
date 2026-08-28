import { randomBytes, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession, toSafeUser } from "@/lib/auth";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";

export const dynamic = "force-dynamic";

const STATE_COOKIE = "google_oauth_state";
const STATE_TTL_SECONDS = 600;

function config() {
  return {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI,
  };
}

function loginRedirect(request: NextRequest, error: string) {
  const url = new URL("/login", request.url);
  url.searchParams.set("oauth_error", error);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const { clientId, clientSecret } = config();
  if (!clientId || !clientSecret) {
    return loginRedirect(request, "Google sign-in is not configured yet.");
  }

  const state = randomBytes(32).toString("hex");
  const redirectUri = config().redirectUri ?? new URL("/api/auth/google/callback", request.url).toString();
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("prompt", "select_account");

  const response = NextResponse.redirect(authUrl);
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/auth/google",
    maxAge: STATE_TTL_SECONDS,
  });
  return response;
}

export async function callback(request: NextRequest) {
  const { clientId, clientSecret } = config();
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const storedState = request.cookies.get(STATE_COOKIE)?.value;
  if (!clientId || !clientSecret || !code || !state || !storedState) {
    return loginRedirect(request, "Google sign-in could not be completed.");
  }
  const provided = Buffer.from(state);
  const expected = Buffer.from(storedState);
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return loginRedirect(request, "Google sign-in could not be verified.");
  }

  const redirectUri = config().redirectUri ?? new URL("/api/auth/google/callback", request.url).toString();
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenResponse.ok) return loginRedirect(request, "Google sign-in could not be completed.");
  const tokens = await tokenResponse.json() as { access_token?: string };
  if (!tokens.access_token) return loginRedirect(request, "Google sign-in could not be completed.");

  const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!profileResponse.ok) return loginRedirect(request, "Google profile could not be verified.");
  const profile = await profileResponse.json() as { email?: string; email_verified?: boolean; name?: string };
  if (!profile.email || profile.email_verified !== true) {
    return loginRedirect(request, "A verified Google email is required.");
  }

  let user = await db.user.findUnique({ where: { email: profile.email.toLowerCase() } });
  if (!user) {
    user = await db.user.create({
      data: {
        email: profile.email.toLowerCase(),
        name: profile.name ?? null,
        passwordHash: null,
        emailVerified: true,
        status: "ACTIVE",
      },
    });
  } else {
    user = await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), status: "ACTIVE", emailVerified: true },
    });
  }
  await createSession(user.id);
  await logAudit({ actorId: user.id, action: AUDIT_ACTIONS.LOGIN, targetType: "User", targetId: user.id, metadata: { provider: "google" } });

  const destination = ["ADMIN", "SUPER_ADMIN", "MENTAL_HEALTH_PROFESSIONAL", "SUPERVISOR"].includes(user.role)
    ? "/admin/personnel"
    : user.onboardingComplete ? "/dashboard" : "/assessment";
  const response = NextResponse.redirect(new URL(destination, request.url));
  response.cookies.delete(STATE_COOKIE);
  return response;
}

