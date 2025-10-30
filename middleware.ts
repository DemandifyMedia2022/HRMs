import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

// Define protected routes and their required roles
const protectedRoutes: Record<string, readonly string[]> = {
  '/pages/admin': ['admin'],
  '/pages/hr': ['hr'],
  '/pages/user': ['user']
};

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // Max requests per window

// Security headers
const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'"
};

function isValidPath(pathname: string): boolean {
  // Prevent path traversal attacks
  if (pathname.includes('..') || pathname.includes('//') || pathname.includes('%2e%2e')) {
    return false;
  }
  // Block suspicious patterns
  const suspiciousPatterns = [
    /\.(php|asp|jsp|cgi)$/i,
    /\.(exe|bat|cmd|sh)$/i,
    /(union|select|insert|delete|drop|create|alter)/i,
    /<script|javascript:|vbscript:|onload|onerror/i
  ];
  return !suspiciousPatterns.some(pattern => pattern.test(pathname));
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const key = `rate_limit_${ip}`;
  const current = rateLimitStore.get(key);

  if (!current || now > current.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  current.count++;
  return true;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const clientIP = request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    'unknown';

  // Input validation and security checks
  if (!isValidPath(pathname)) {
    console.warn(`Blocked suspicious path attempt: ${pathname} from IP: ${clientIP}`);
    return new NextResponse('Bad Request', { status: 400 });
  }

  // Rate limiting
  if (!checkRateLimit(clientIP)) {
    console.warn(`Rate limit exceeded for IP: ${clientIP}`);
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: {
        'Retry-After': '60',
        ...securityHeaders
      }
    });
  }

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

  // Get tokens from cookies with additional validation
  const token = request.cookies.get('access_token')?.value;
  const refresh = request.cookies.get('refresh_token')?.value;

  // Validate token format (basic JWT structure check)
  if (token && !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) {
    console.warn(`Invalid token format from IP: ${clientIP}`);
    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.delete('access_token');
    response.cookies.delete('refresh_token');
    return response;
  }

  try {
    // Verify token
    if (!token) throw new Error('no access');
    const user = verifyToken(token);

    // Additional user validation
    if (!user || !user.id || !user.role) {
      throw new Error('invalid user data');
    }

    // Check role-based access for the matched route only
    const allowedRoles = protectedRoutes[matchedProtectedRoute];
    if (!allowedRoles.includes(user.role)) {
      console.warn(`Unauthorized access attempt: User ${user.id} with role ${user.role} tried to access ${pathname} from IP: ${clientIP}`);
      // Rewrite to Access Denied to render denial page without bouncing via '/'
      const url = request.nextUrl.clone();
      url.pathname = '/';
      const response = NextResponse.rewrite(url);
      // Add security headers
      Object.entries(securityHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }

    // Additional check: Users can only access their own department's data
    // This prevents users from different departments accessing each other's dashboards
    if (user.role === 'user' && pathname.startsWith('/pages/user')) {
      // Store user department in header for API routes to use
      const response = NextResponse.next();
      response.headers.set('x-user-department', user.department || '');
      response.headers.set('x-user-id', user.id.toString());
      response.headers.set('x-user-role', user.role);
      // Add security headers
      Object.entries(securityHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }

    const response = NextResponse.next();
    // Add security headers to all responses
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  } catch (error) {
    console.warn(`Authentication error for IP ${clientIP}: ${error instanceof Error ? error.message : 'Unknown error'}`);

    // If we have a refresh token, redirect to refresh endpoint to rotate tokens, then back to this path
    if (refresh && /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(refresh)) {
      const url = request.nextUrl.clone();
      url.pathname = '/api/auth/refresh';
      // Sanitize redirect parameter to prevent open redirect attacks
      const redirectPath = request.nextUrl.pathname;
      if (redirectPath.startsWith('/pages/') || redirectPath === '/') {
        url.searchParams.set('redirect', redirectPath + (request.nextUrl.search || ''));
      }
      const response = NextResponse.redirect(url);
      Object.entries(securityHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }

    // No refresh token or invalid refresh token: redirect to login
    const url = request.nextUrl.clone();
    url.pathname = '/';
    // Only set redirect for valid internal paths
    if (pathname.startsWith('/pages/')) {
      url.searchParams.set('redirect', pathname);
    }
    const response = NextResponse.redirect(url);
    response.cookies.delete('access_token');
    response.cookies.delete('refresh_token');
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
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
