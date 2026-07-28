// app/api/refresh/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  REFRESH_TOKEN_COOKIE,
  clearAuthCookies,
  requestTokenRefresh,
  setAuthCookies,
} from "@/lib/auth";

// The refresh token is httpOnly, so the browser cannot call the backend's
// /api/auth/refresh itself. This handler does it on the client's behalf and
// rotates the cookies, returning only the new access token for in-memory use.
export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!refreshToken) {
    return NextResponse.json({ error: "NO_REFRESH_TOKEN" }, { status: 401 });
  }

  const result = await requestTokenRefresh(refreshToken);

  if (result.status === "error") {
    // 503, not 401: the session may still be valid, so the caller must not
    // treat this as "log the user out".
    return NextResponse.json({ error: "REFRESH_UNAVAILABLE" }, { status: 503 });
  }

  if (result.status === "invalid") {
    const response = NextResponse.json(
      { error: "INVALID_REFRESH_TOKEN" },
      { status: 401 },
    );
    clearAuthCookies(response);
    return response;
  }

  const response = NextResponse.json({
    jwt: result.tokens.jwt,
    userId: result.tokens.userId,
  });
  setAuthCookies(response, result.tokens);
  return response;
}
