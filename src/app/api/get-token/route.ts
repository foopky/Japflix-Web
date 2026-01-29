import { NextResponse } from "next/server";

const ALLOWED_ORIGINS = [
  "https://www.netflix.com",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

function buildCorsHeaders(origin?: string, allowPrivateNetwork = false) {
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) return {};
  const headers: Record<string, string> = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
  if (allowPrivateNetwork) {
    // preflight must include this when client requested private network access
    headers["Access-Control-Allow-Private-Network"] = "true";
  }
  return headers;
}

export async function OPTIONS(request: Request) {
  console.log("Handling OPTIONS preflight request");
  const origin = "https://www.netflix.com";
  // 브라우저가 프리플라이트 보낼 때 Access-Control-Request-Private-Network 헤더를 포함할 수 있음
  const wantsPrivateNetwork =
    request.headers.get("access-control-request-private-network") === "true";
  const headers: Record<string, string> = buildCorsHeaders(
    origin,
    wantsPrivateNetwork
  );
  return new NextResponse(null, {
    status: 204,
    headers,
  });
}

export async function GET(request: Request) {
  console.log("Handling GET request for token");
  const origin = request.headers.get("origin") ?? undefined;
  // GET 응답에도 기본 CORS 헤더 포함 (프리플라이트과 동일 origin이 허용된 경우)
  const headers: Record<string, string> = buildCorsHeaders(origin, false);
  return NextResponse.json({}, { headers });
}
