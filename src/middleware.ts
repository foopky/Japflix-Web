import { NextResponse, type NextRequest } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  USER_ID_COOKIE,
  clearAuthCookies,
  isAccessTokenExpired,
  requestTokenRefresh,
  setAuthCookies,
} from "@/lib/auth";

// Entry-point refresh. Runs before any page renders, which is the only place
// on the server where cookies can actually be written for a navigation —
// Server Components can read cookies but not set them.
const PUBLIC_PATHS = ["/login", "/signup", "/terms", "/privacy"];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

function redirectToLogin(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  const response = NextResponse.redirect(url);
  clearAuthCookies(response);
  return response;
}

export async function middleware(request: NextRequest) {
  if (isPublic(request.nextUrl.pathname)) return NextResponse.next();

  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  // Fast path: token still good for at least the skew window.
  if (accessToken && !isAccessTokenExpired(accessToken)) {
    return NextResponse.next();
  }

  if (!refreshToken) return redirectToLogin(request);

  const result = await requestTokenRefresh(refreshToken);

  if (result.status === "invalid") return redirectToLogin(request);

  if (result.status === "error") {
    // The backend is unreachable, not saying no. Logging the user out over a
    // transient blip is worse than letting the page render and having the
    // client interceptor retry.
    return NextResponse.next();
  }

  // Rewrite the incoming cookies so this very render sees the new token
  // instead of the stale one it arrived with.
  request.cookies.set(ACCESS_TOKEN_COOKIE, result.tokens.jwt);
  request.cookies.set(REFRESH_TOKEN_COOKIE, result.tokens.refreshToken);
  if (result.tokens.userId !== "") {
    request.cookies.set(USER_ID_COOKIE, String(result.tokens.userId));
  }

  const response = NextResponse.next({
    request: { headers: request.headers },
  });
  setAuthCookies(response, result.tokens);
  return response;
}

export const config = {
  // Everything except route handlers, Next internals and static files.
  matcher: ["/((?!api/|_next/static|_next/image|favicon.ico|.*\\.).*)"],
};
