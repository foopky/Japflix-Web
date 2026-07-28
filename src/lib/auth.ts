import type { NextResponse } from "next/server";

// Shared auth primitives for the server side. Imported by both the Edge
// middleware and the Node route handlers, so this file must stay runtime
// agnostic: no `next/headers`, no Node built-ins (Buffer, crypto, ...).

export const ACCESS_TOKEN_COOKIE = "authToken";
export const REFRESH_TOKEN_COOKIE = "refreshToken";
export const USER_ID_COOKIE = "userId";

export const AUTH_COOKIES = [
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  USER_ID_COOKIE,
] as const;

// Matches the backend refresh token TTL (14 days).
const REFRESH_MAX_AGE = 60 * 60 * 24 * 14;

const BASE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

// The access token cookie deliberately lives as long as the refresh token.
// Its real lifetime is the JWT `exp`, which is what we actually check —
// expiring the cookie sooner would also throw away userId and force a
// pointless re-login while a perfectly valid refresh token still exists.
export const ACCESS_COOKIE_OPTIONS = {
  ...BASE_COOKIE_OPTIONS,
  maxAge: REFRESH_MAX_AGE,
};

// Kept on path "/" (not "/api/refresh") because the middleware has to read it
// while handling ordinary page requests.
export const REFRESH_COOKIE_OPTIONS = {
  ...BASE_COOKIE_OPTIONS,
  maxAge: REFRESH_MAX_AGE,
};

export interface TokenBundle {
  jwt: string;
  refreshToken: string;
  userId: number | string;
}

export type RefreshResult =
  | { status: "ok"; tokens: TokenBundle }
  // backend rejected the token (401 INVALID_REFRESH_TOKEN) -> re-login
  | { status: "invalid" }
  // upstream unreachable / 5xx -> session is probably still fine, retry later
  | { status: "error" };

/** Decodes the `exp` claim without verifying the signature (the backend does that). */
export function decodeJwtExp(token: string): number | null {
  const payload = token.split(".")[1];
  if (!payload) return null;
  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    // atob yields a binary string; decode it as UTF-8 so non-ASCII claims
    // (e.g. a Korean display name) don't break JSON.parse.
    const bytes = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
    const { exp } = JSON.parse(new TextDecoder().decode(bytes));
    return typeof exp === "number" ? exp : null;
  } catch {
    return null;
  }
}

/** Treats an unparseable token as expired so it gets refreshed rather than used. */
export function isAccessTokenExpired(token: string, skewSeconds = 30): boolean {
  const exp = decodeJwtExp(token);
  if (exp === null) return true;
  return exp * 1000 <= Date.now() + skewSeconds * 1000;
}

export async function requestTokenRefresh(
  refreshToken: string,
): Promise<RefreshResult> {
  let response: Response;
  try {
    response = await fetch(
      `${process.env.NEXT_PUBLIC_API_HOST}/api/auth/refresh`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
        cache: "no-store",
      },
    );
  } catch {
    return { status: "error" };
  }

  if (response.status === 401) return { status: "invalid" };
  if (!response.ok) return { status: "error" };

  try {
    const data = await response.json();
    // A rotated refresh token is mandatory: reusing the old one would make the
    // next refresh fail, so treat a missing one as an unusable response.
    if (!data?.jwt || !data?.refreshToken) return { status: "error" };
    return {
      status: "ok",
      tokens: {
        jwt: data.jwt,
        refreshToken: data.refreshToken,
        userId: data.userId ?? "",
      },
    };
  } catch {
    return { status: "error" };
  }
}

export function setAuthCookies(response: NextResponse, tokens: TokenBundle) {
  response.cookies.set(ACCESS_TOKEN_COOKIE, tokens.jwt, ACCESS_COOKIE_OPTIONS);
  response.cookies.set(
    REFRESH_TOKEN_COOKIE,
    tokens.refreshToken,
    REFRESH_COOKIE_OPTIONS,
  );
  if (tokens.userId !== "" && tokens.userId !== undefined) {
    response.cookies.set(
      USER_ID_COOKIE,
      String(tokens.userId),
      ACCESS_COOKIE_OPTIONS,
    );
  }
}

export function clearAuthCookies(response: NextResponse) {
  for (const name of AUTH_COOKIES) {
    response.cookies.set(name, "", { ...BASE_COOKIE_OPTIONS, maxAge: 0 });
  }
}
