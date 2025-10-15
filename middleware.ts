import { NextRequest, NextResponse } from "next/server";

// Protect app pages under /pages/**. Unauthenticated users are redirected to "/".
// Adjust REDIRECT_PATH if you add a dedicated login page later (e.g. "/login").
const REDIRECT_PATH = "/";

const PUBLIC_PATHS = new Set<string>([
  "/", // landing
]);

// API auth endpoints must remain public for login/me to work
const PUBLIC_API_PREFIXES = [
  "/api/auth/login",
  "/api/auth/me",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow Next internals and static assets
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/static/") ||
    pathname.startsWith("/assets/") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  ) {
    return NextResponse.next();
  }

  // Allow public paths
  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  // Allow public API auth routes
  if (PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Only guard pages under /pages/** per requirement
  if (pathname.startsWith("/pages/")) {
    const token = req.cookies.get("access_token")?.value;
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = REDIRECT_PATH;
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  // Run only for pages under /pages/** so APIs/components/dev assets are untouched
  matcher: ["/pages/:path*"],
};
