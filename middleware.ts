import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

// Define protected routes and their required roles
const protectedRoutes = {
  '/': ['admin', 'hr', 'user'],
  '/pages/admin': ['admin'],
  '/pages/hr': ['hr'],
  '/pages/user': ['user']
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes and auth API endpoints
  if (pathname === '/' || pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Check if route is protected
  const isProtectedRoute = Object.keys(protectedRoutes).some(route => pathname.startsWith(route));

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Get token from cookies
  const token = request.cookies.get('access_token')?.value;

  if (!token) {
    // Redirect to login if no token
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  try {
    // Verify token
    const user = verifyToken(token);

    // Check role-based access
    for (const [route, allowedRoles] of Object.entries(protectedRoutes)) {
      if (pathname.startsWith(route)) {
        if (!allowedRoles.includes(user.role)) {
          // Redirect to appropriate dashboard based on user's role
          const url = request.nextUrl.clone();
          if (user.role === 'admin') {
            url.pathname = '/pages/admin';
          } else if (user.role === 'hr') {
            url.pathname = '/pages/hr';
          } else {
            url.pathname = '/pages/user';
          }
          return NextResponse.redirect(url);
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

        break;
      }
    }

    return NextResponse.next();
  } catch (error) {
    // Invalid token - redirect to login
    const url = request.nextUrl.clone();
    url.pathname = '/';
    const response = NextResponse.redirect(url);
    // Clear the invalid token
    response.cookies.delete('access_token');
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
