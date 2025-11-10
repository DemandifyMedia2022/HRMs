import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, generateToken, generateRefreshToken, mapTypeToRole } from '@/lib/auth';
import { handleError } from '@/lib/error-handler';
import { getRequiredEnv } from '@/lib/env';
import crypto from 'crypto';

const MAX_LOGIN_ATTEMPTS = Number(process.env.MAX_LOGIN_ATTEMPTS || 5);
const LOCKOUT_DURATION_MS = Number(process.env.LOCKOUT_DURATION_MS || 15 * 60 * 1000);
const ATTEMPT_WINDOW_SEC = Number(process.env.LOGIN_ATTEMPT_WINDOW_SEC || 60 * 60); // 1 hour window

function encryptToken(plain: string): string {
  const secret = getRequiredEnv('RESPONSE_ENC_SECRET');
  const key = crypto.createHash('sha256').update(secret).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}.${ciphertext.toString('base64')}.${tag.toString('base64')}`;
}

async function checkAccountLockout(_email: string): Promise<{ locked: boolean; remainingTime?: number }> {
  return { locked: false };
}

async function recordFailedAttempt(_email: string): Promise<void> {
  // no-op (rate limiting/lockout disabled)
}

async function clearFailedAttempts(_email: string): Promise<void> {
  // no-op (rate limiting/lockout disabled)
}

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

    const lock = await checkAccountLockout(email);
    if (lock.locked) {
      return NextResponse.json(
        {
          message: 'Account temporarily locked due to too many failed attempts',
          remainingTime: lock.remainingTime
        },
        { status: 429 }
      );
    }

    const user = await (prisma as any).users.findUnique({ where: { email } });
    if (!user) {
      await recordFailedAttempt(email);
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }
    const dbHash: string = user.password || '';
    const normalizedHash = dbHash.startsWith('$2y$') ? '$2a$' + dbHash.slice(4) : dbHash;
    const valid = comparePassword(password, normalizedHash);
    if (!valid) {
      await recordFailedAttempt(email);
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    await clearFailedAttempts(email);

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
    const isProd = process.env.NODE_ENV === 'production';
    const csrfToken = crypto.randomUUID().replace(/-/g, '');
    const tokenEncrypted = encryptToken(token);
    // Return ONLY token and success message - no user details yet
    const res = NextResponse.json({
      success: true,
      message: 'Login successful. Token generated.',
      tokenEncrypted,
      csrfToken
    });
    // Short-lived access token (e.g., 15 minutes)
    res.cookies.set('access_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProd,
      path: '/',
      maxAge: 60 * 15 // 15 minutes
    });
    // CSRF token cookie (double-submit; httpOnly to prevent JS access)
    res.cookies.set('csrf_token', csrfToken, {
      httpOnly: true,
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
    return handleError(e, req);
  }
}
