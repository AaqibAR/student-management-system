import "server-only";

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { cache } from "react";
import type { AuthResponse, Session, UserAccount } from "@/lib/types";

const COOKIE_NAME = "student_management_session";
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export function jsonError(status: number, detail: string) {
  return NextResponse.json({ status, detail }, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export function hasSameOrigin(request: NextRequest) {
  const expectedOrigin = process.env.APP_ORIGIN ?? new URL(request.url).origin;
  return request.headers.get("origin") === expectedOrigin
    && request.headers.get("sec-fetch-site") !== "cross-site";
}

export async function backendRequest(path: string, options: RequestInit = {}) {
  const baseUrl = process.env.API_BASE_URL
    ?? process.env.NEXT_PUBLIC_API_BASE_URL
    ?? "http://localhost:8080";
  return fetch(`${baseUrl.replace(/\/$/, "")}${path}`, {
    ...options,
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(15000),
  });
}

export async function sessionToken() {
  return (await cookies()).get(COOKIE_NAME)?.value;
}

export function clearSession(response: NextResponse) {
  response.cookies.set(COOKIE_NAME, "", { ...cookieOptions, maxAge: 0 });
  return response;
}

function isUser(value: unknown): value is UserAccount {
  if (!value || typeof value !== "object") return false;
  const user = value as Partial<UserAccount>;
  return typeof user.id === "number" && Number.isSafeInteger(user.id) && user.id > 0
    && typeof user.name === "string" && typeof user.email === "string"
    && (user.role === "USER" || user.role === "ADMIN");
}

// Claims supply display metadata only. Authentication is always checked by Spring Boot.
function tokenMetadata(token: string) {
  try {
    const claims: unknown = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
    if (!claims || typeof claims !== "object") return null;
    const { exp, roles } = claims as { exp?: unknown; roles?: unknown };
    if (typeof exp !== "number" || !Number.isFinite(exp)
      || !Array.isArray(roles) || roles.length !== 1
      || (roles[0] !== "USER" && roles[0] !== "ADMIN")) return null;
    return { expiresAt: exp * 1000, role: roles[0] as UserAccount["role"] };
  } catch {
    return null;
  }
}

export type SessionResult =
  | { state: "authenticated"; session: Session }
  | { state: "anonymous" | "expired" | "unavailable" };

export const readSession = cache(async (): Promise<SessionResult> => {
  const token = await sessionToken();
  if (!token) return { state: "anonymous" };
  const metadata = tokenMetadata(token);
  if (!metadata || metadata.expiresAt <= Date.now()) return { state: "expired" };
  try {
    const response = await backendRequest("/api/auth/me", {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    });
    if (response.status === 401 || response.status === 403) return { state: "expired" };
    if (!response.ok) return { state: "unavailable" };
    const user: unknown = await response.json();
    if (!isUser(user)) return { state: "unavailable" };
    return {
      state: "authenticated",
      session: { user: { id: user.id, name: user.name, email: user.email, role: metadata.role }, expiresAt: metadata.expiresAt },
    };
  } catch {
    return { state: "unavailable" };
  }
});

export async function relayResponse(upstream: Response, expireOn401 = true) {
  const response = new NextResponse(upstream.status === 204 ? null : await upstream.text(), {
    status: upstream.status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
  return upstream.status === 401 && expireOn401 ? clearSession(response) : response;
}

export async function authenticate(request: NextRequest, action: "login" | "register") {
  if (!hasSameOrigin(request)) return jsonError(403, "Reload the page and try again.");
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return jsonError(415, "Send the form as JSON.");
  }
  let input: Record<string, unknown>;
  try {
    const text = await request.text();
    if (text.length > 16384) return jsonError(413, "The form is too large.");
    const parsed: unknown = JSON.parse(text);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return jsonError(400, "Check the form fields and try again.");
    }
    input = parsed as Record<string, unknown>;
    if (typeof input.email !== "string" || typeof input.password !== "string"
      || (action === "register" && typeof input.name !== "string")) {
      return jsonError(400, "Complete the required form fields.");
    }
  } catch {
    return jsonError(400, "Check the form fields and try again.");
  }
  try {
    const response = await backendRequest(`/api/auth/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        email: (input.email as string).trim(),
        password: input.password,
        ...(action === "register" ? { name: (input.name as string).trim() } : {}),
      }),
    });
    if (!response.ok) return await relayResponse(response, false);
    const auth: Partial<AuthResponse> = await response.json();
    const metadata = typeof auth.accessToken === "string" ? tokenMetadata(auth.accessToken) : null;
    if (!isUser(auth.user) || !metadata || metadata.expiresAt <= Date.now()
      || auth.tokenType !== "Bearer" || typeof auth.expiresIn !== "number"
      || auth.expiresIn < 1 || auth.expiresIn > 3600
      || typeof auth.accessToken !== "string" || auth.accessToken.length > 3800) {
      return jsonError(502, "The server returned an invalid sign-in response. Try again.");
    }
    const session: Session = { user: { id: auth.user.id, name: auth.user.name, email: auth.user.email, role: metadata.role }, expiresAt: metadata.expiresAt };
    const result = NextResponse.json(session, {
      status: response.status,
      headers: { "Cache-Control": "no-store" },
    });
    result.cookies.set(COOKIE_NAME, auth.accessToken, {
      ...cookieOptions,
      maxAge: Math.max(1, Math.floor(Math.min(auth.expiresIn, (metadata.expiresAt - Date.now()) / 1000))),
    });
    return result;
  } catch {
    return jsonError(503, "The service is temporarily unavailable. Please try again.");
  }
}
