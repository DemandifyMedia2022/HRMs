import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

// Define protected routes and their required roles
const protectedRoutes: Record<string, readonly string[]> = {
  '/pages/admin': ['admin'],
  '/pages/hr': ['hr'],
  '/pages/user': ['user']
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes and auth API endpoints
  if (pathname === '/') {
    // If already logged in, send to respective dashboard
    const token = request.cookies.get('access_token')?.value;
    if (token) {
      try {
        const user = verifyToken(token);
        const url = request.nextUrl.clone();
        if (user.role === 'admin') url.pathname = '/pages/admin';
        else if (user.role === 'hr') url.pathname = '/pages/hr';
        else url.pathname = '/pages/user';
        return NextResponse.redirect(url);
      } catch {
        // fall through to show public home if token invalid
      }
    }
    return NextResponse.next();
  }
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Check if route is protected
  // Match the most specific route first by sorting keys by length desc
  const protectedRouteKeys = Object.keys(protectedRoutes).sort((a, b) => b.length - a.length);
  const matchedProtectedRoute = protectedRouteKeys.find(route => pathname.startsWith(route));

  if (!matchedProtectedRoute) {
    return NextResponse.next();
  }

  // Get tokens from cookies
  const token = request.cookies.get('access_token')?.value;
  const refresh = request.cookies.get('refresh_token')?.value;

  try {
    // Verify token
    if (!token) throw new Error('no access');
    const user = verifyToken(token);

    // Check role-based access for the matched route only
    const allowedRoles = protectedRoutes[matchedProtectedRoute];
    if (!allowedRoles.includes(user.role)) {
      // Rewrite to Access Denied to render denial page without bouncing via '/'
      const url = request.nextUrl.clone();
      url.pathname = '/access-denied';
      return NextResponse.rewrite(url);
    }

    // Additional check: Users can only access their own department's data
    // This prevents users from different departments accessing each other's dashboards
    if (user.role === 'user' && pathname.startsWith('/pages/user')) {
      // Store user department in header for API routes to use
      const response = NextResponse.next();
      response.headers.set('x-user-department', user.department || '');
      response.headers.set('x-user-id', user.id.toString());
      response.headers.set('x-user-role', user.role);
      return response;
    }

    return NextResponse.next();
  } catch (error) {
    // If we have a refresh token, redirect to refresh endpoint to rotate tokens, then back to this path
    if (refresh) {
      const url = request.nextUrl.clone();
      url.pathname = '/api/auth/refresh';
      url.searchParams.set('redirect', request.nextUrl.pathname + (request.nextUrl.search || ''));
      return NextResponse.redirect(url);
    }
    // No refresh token: redirect to login
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.searchParams.set('redirect', pathname);
    const response = NextResponse.redirect(url);
    response.cookies.delete('access_token');
    response.cookies.delete('refresh_token');
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ]
};
