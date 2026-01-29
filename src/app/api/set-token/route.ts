// app/api/set-token/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const { jwt, userId } = await request.json();

  if (!jwt || !userId) {
    return NextResponse.json(
      { message: "Token or User ID is missing." },
      { status: 400 }
    );
  }

  const cookieStore = await cookies();

  // authToken 설정
  cookieStore.set("authToken", jwt);
  cookieStore.set("userId", userId);

  return NextResponse.json({
    success: true,
    message: "Token set successfully.",
  });
}
