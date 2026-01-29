// app/api/set-token/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const { jwt, userId } = await request.json();

  if (!jwt || !userId) {
    return NextResponse.json(
      { message: "Token or User ID is missing." },
      { status: 400 },
    );
  }

  const cookieStore = await cookies();

  // 모바일 환경을 위한 쿠키 옵션 설정
  const cookieOptions = {
    httpOnly: true, // XSS 공격 방지
    secure: process.env.NODE_ENV === "production", // HTTPS에서만 전송 (production)
    sameSite: "lax" as const, // CSRF 방지, 모바일 호환성 개선
    path: "/", // 모든 경로에서 쿠키 접근 가능
    maxAge: 60 * 60 * 24 * 7, // 7일 (초 단위)
  };

  // authToken 설정
  cookieStore.set("authToken", jwt, cookieOptions);
  cookieStore.set("userId", String(userId), cookieOptions);

  return NextResponse.json({
    success: true,
    message: "Token set successfully.",
  });
}
