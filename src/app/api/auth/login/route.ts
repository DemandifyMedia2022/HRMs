import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, generateToken, generateRefreshToken, mapTypeToRole } from '@/lib/auth';

/**
 * POST /api/auth/login
 * First gate: Validates credentials and generates JWT token
 * "You say you're Sir Email-Password? Here's your entry token. Welcome, but I'm not giving you access to the treasury yet."
 */
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    const user = await (prisma as any).users.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }
    const dbHash: string = user.password || '';
    const normalizedHash = dbHash.startsWith('$2y$') ? '$2a$' + dbHash.slice(4) : dbHash;
    const valid = comparePassword(password, normalizedHash);
    if (!valid) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    // Determine role strictly from DB `type` column
    const dept = (user as any).department ?? null;
    const deptLower = dept ? String(dept).toLowerCase() : null;
    const idNum = typeof user.id === 'bigint' ? Number(user.id) : (user.id as number);
    const role = mapTypeToRole((user as any).type);

    // Generate tokens
    const token = generateToken({
      id: idNum,
      email: user.email,
      role,
      department: deptLower as any
    });
    const refreshToken = generateRefreshToken({ id: idNum });

    // Return ONLY token and success message - no user details yet
    const res = NextResponse.json({
      success: true,
      message: 'Login successful. Token generated.',
      // token, // Return token for client to validate
      // userId: idNum // Only return user ID
    });

    const isProd = process.env.NODE_ENV === 'production';
    const csrfToken = crypto.randomUUID().replace(/-/g, '');
    // Short-lived access token (e.g., 15 minutes)
    res.cookies.set('access_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProd,
      path: '/',
      maxAge: 60 * 15 // 15 minutes
    });
    // CSRF token (double-submit cookie) - non-HttpOnly so client can read and send in header
    res.cookies.set('csrf_token', csrfToken, {
      httpOnly: false,
      sameSite: 'strict',
      secure: isProd,
      path: '/',
      maxAge: 60 * 60 // 1 hour
    });
    // Session refresh token (no maxAge -> cleared on browser close). Token itself has server-side expiry.
    res.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProd,
      path: '/'
    });

    // Fire-and-forget: trigger ESSL attendance sync for realtime data on login
    try {
      const syncUrl = process.env.ESSL_SYNC_URL;
      if (syncUrl) {
        const emp = (user as any).emp_code ? String((user as any).emp_code) : undefined;
        const u = emp ? `${syncUrl}${syncUrl.includes('?') ? '&' : '?'}emp_code=${encodeURIComponent(emp)}` : syncUrl;
        const controller = new AbortController();
        const timeout = Number(process.env.ESSL_SYNC_TIMEOUT_MS || 5000);
        const to = setTimeout(() => controller.abort(), timeout);
        fetch(u, { method: 'POST', signal: controller.signal })
          .catch(() => {})
          .finally(() => clearTimeout(to));
      }
    } catch {}

    return res;
  } catch (e: any) {
    return NextResponse.json({ message: 'Login error', details: e.message }, { status: 500 });
  }
}
