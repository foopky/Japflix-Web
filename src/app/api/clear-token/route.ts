// app/api/clear-token/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { REFRESH_TOKEN_COOKIE, clearAuthCookies } from "@/lib/auth";

// httpOnly cookies cannot be removed from the browser with document.cookie,
// so logout / account deletion must clear them here on the server.
export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

  // Revoke server-side as well, otherwise the refresh token stays valid for
  // its full 14 days after the user logs out.
  if (refreshToken) {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_HOST}/api/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
        cache: "no-store",
      });
    } catch (error) {
      // Never block logout on this — the cookies still have to go.
      console.error("Backend logout failed:", error);
    }
  }

  const response = NextResponse.json({
    success: true,
    message: "Token cleared successfully.",
  });
  clearAuthCookies(response);
  return response;
}
