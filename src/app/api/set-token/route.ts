// app/api/set-token/route.ts
import { NextResponse } from "next/server";
import { setAuthCookies } from "@/lib/auth";

export async function POST(request: Request) {
  const { jwt, userId, refreshToken } = await request.json();

  // refreshToken is required too: without it the session silently becomes
  // unrefreshable and dies at the first access-token expiry.
  if (!jwt || !userId || !refreshToken) {
    return NextResponse.json(
      { message: "Token, refresh token or User ID is missing." },
      { status: 400 },
    );
  }

  const response = NextResponse.json({
    success: true,
    message: "Token set successfully.",
  });
  setAuthCookies(response, { jwt, refreshToken, userId });
  return response;
}
