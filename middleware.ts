import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';

// Define protected routes and their required roles
const protectedRoutes: Record<string, readonly string[]> = {
  '/pages/admin': ['admin'],
  '/pages/hr': ['hr'],
  '/pages/user': ['user', 'admin', 'hr']
};

// Security headers builder (per-request nonce)
function buildSecurityHeaders(nonce: string) {
  return {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    // Remove 'unsafe-inline'; allow only nonce-based inline scripts/styles
    // Add strict-dynamic to allow trusted scripts to load other scripts
    // 'Content-Security-Policy':
    //   [
    //     "default-src 'self'",
    //     `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    //     `style-src 'self' 'nonce-${nonce}'`,
    //     "img-src 'self' data: https:",
    //     "font-src 'self'",
    //     "connect-src 'self' https: http:",
    //   ].join('; ')
  } as Record<string, string>;
}

function applySecurityHeaders(response: NextResponse, nonce: string) {
  const headers = buildSecurityHeaders(nonce);
  Object.entries(headers).forEach(([k, v]) => response.headers.set(k, v));
  // Expose nonce so pages can consume it if they render inline tags (optional)
  response.headers.set('x-csp-nonce', nonce);
  return response;
}

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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method.toUpperCase();
  const nonce = crypto.randomUUID().replace(/-/g, '');
  const isProd = process.env.NODE_ENV === 'production';
  const clientIP = request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    'unknown';

  
  if (!isValidPath(pathname)) {
    console.warn(`Blocked suspicious path attempt: ${pathname} from IP: ${clientIP}`);
    return applySecurityHeaders(new NextResponse('Bad Request', { status: 400 }), nonce);
  }

  // Rate limiting (VULN-019)
  if (pathname.startsWith('/api/')) {
    const limitResult = checkRateLimit(clientIP, 100, 60000); // 100 requests per minute
    if (!limitResult.success) {
      return new NextResponse(JSON.stringify({ message: 'Too many requests' }), {
        status: 429,
        headers: {
          'content-type': 'application/json',
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': String(limitResult.remaining),
          'X-RateLimit-Reset': String(limitResult.reset)
        }
      });
    }
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
    return applySecurityHeaders(NextResponse.next(), nonce);
  }
  // No blanket bypass for /api/auth; specific exemptions are handled in the CSRF block below

  // CSRF protection for mutating API requests (double-submit cookie)
  if (
    pathname.startsWith('/api/') &&
    ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
  ) {
    // Allow login/validate/refresh to proceed without CSRF (pre-session or token bootstrap)
    const exempt = /^(?:\/api\/auth\/(login|validate|refresh))/.test(pathname);
    if (!exempt) {
      const headerToken = request.headers.get('x-csrf-token') || '';
      const cookieToken = request.cookies.get('csrf_token')?.value || '';
      if (!headerToken || !cookieToken || headerToken !== cookieToken) {
        return applySecurityHeaders(new NextResponse('Forbidden - CSRF', { status: 403 }), nonce);
      }
    }
  }

  // API-wide auth guard (default-protect APIs)
  if (pathname.startsWith('/api/')) {
    // Allow unauthenticated only for bootstrap endpoints; CSRF rules still apply separately
    const publicAuthAllowed = /^(?:\/api\/auth\/(login|validate|refresh|logout))$/.test(pathname);
    if (!publicAuthAllowed) {
      const apiToken = request.cookies.get('access_token')?.value || '';
      if (!apiToken) {
        return applySecurityHeaders(
          new NextResponse(JSON.stringify({ message: 'Unauthorized' }), {
            status: 401,
            headers: { 'content-type': 'application/json' }
          }),
          nonce
        );
      }
      try {
        const user = verifyToken(apiToken);
        const response = NextResponse.next();
        // Sliding session: refresh access token cookie expiry on each valid API request
        response.cookies.set('access_token', apiToken, {
          httpOnly: true,
          sameSite: 'strict',
          secure: isProd,
          path: '/',
          maxAge: 60 * 60
        });
        response.headers.set('x-user-role', user.role);
        response.headers.set('x-user-id', String(user.id));
        response.headers.set('x-user-department', user.department || '');
        return applySecurityHeaders(response, nonce);
      } catch {
        return applySecurityHeaders(
          new NextResponse(JSON.stringify({ message: 'Unauthorized' }), {
            status: 401,
            headers: { 'content-type': 'application/json' }
          }),
          nonce
        );
      }
    }
  }

  // Block invalid /pages/* routes that don't match expected patterns
  if (pathname.startsWith('/pages/')) {
    const validPagePatterns = [
      /^\/pages\/admin(\/.*)?$/,
      /^\/pages\/hr(\/.*)?$/,
      /^\/pages\/user(\/.*)?$/,
      /^\/pages\/account$/,
      /^\/pages\/settings$/,
      /^\/pages\/notifications$/,
      /^\/pages\/survey-form$/
    ];

    const isValidPage = validPagePatterns.some(pattern => pattern.test(pathname));

    if (!isValidPage) {
      console.warn(`Blocked invalid page route: ${pathname} from IP: ${clientIP}`);
      // Redirect to home instead of allowing invalid routes
      return applySecurityHeaders(NextResponse.redirect(new URL('/', request.url)), nonce);
    }
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

    // Pass user context to downstream handlers via headers
    const response = NextResponse.next();
    // Sliding session: refresh access token cookie expiry on each valid page request
    response.cookies.set('access_token', token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: isProd,
      path: '/',
      maxAge: 60 * 60
    });
    response.headers.set('x-user-role', user.role);
    response.headers.set('x-user-id', String(user.id));
    response.headers.set('x-user-department', user.department || '');

    // Check role-based access for the matched route only
    const allowedRoles = protectedRoutes[matchedProtectedRoute];
    if (!allowedRoles.includes(user.role)) {
      console.warn(`Unauthorized access attempt: User ${user.id} with role ${user.role} tried to access ${pathname} from IP: ${clientIP}`);
      // Rewrite to Access Denied to render denial page without bouncing via '/'
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return applySecurityHeaders(NextResponse.rewrite(url), nonce);
    }

    return applySecurityHeaders(response, nonce);
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
      return applySecurityHeaders(NextResponse.redirect(url), nonce);
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
    return applySecurityHeaders(response, nonce);
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
