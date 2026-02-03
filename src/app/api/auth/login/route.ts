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

// TODO: Implement DB-based rate limiting since Redis is removed
async function checkAccountLockout(_email: string): Promise<{ locked: boolean; remainingTime?: number }> {
  return { locked: false };
}

async function recordFailedAttempt(_email: string): Promise<void> {
  // no-op
}

async function clearFailedAttempts(_email: string): Promise<void> {
  // no-op
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

    const emailNormalized = String(email).trim().toLowerCase();

    const lock = await checkAccountLockout(emailNormalized);
    if (lock.locked) {
      return NextResponse.json(
        {
          message: 'Account temporarily locked due to too many failed attempts',
          remainingTime: lock.remainingTime
        },
        { status: 429 }
      );
    }

    const user = await (async () => {
      try {
        // Prefer a case-insensitive match (useful if DB collation is case-sensitive)
        return await (prisma as any).users.findFirst({
          where: {
            email: {
              equals: emailNormalized,
              mode: 'insensitive'
            }
          }
        });
      } catch {
        // Fallback if `mode: 'insensitive'` isn't supported by the current Prisma/DB
        return await (prisma as any).users.findUnique({ where: { email: emailNormalized } });
      }
    })();
    if (!user) {
      await recordFailedAttempt(emailNormalized);
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }
    const dbHash: string = user.password || '';
    const normalizedHash = dbHash.startsWith('$2y$') ? '$2b$' + dbHash.slice(4) : dbHash;
    const isBcryptHash = /^\$2[aby]\$/.test(normalizedHash);
    const valid = isBcryptHash ? comparePassword(password, normalizedHash) : password === normalizedHash;
    if (!valid) {
      await recordFailedAttempt(emailNormalized);
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    await clearFailedAttempts(emailNormalized);

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
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const isSecure = baseUrl.startsWith('https://');
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
      sameSite: 'strict',
      secure: isSecure,
      path: '/',
      maxAge: 60 * 60 // 1 hour
    });
    // CSRF token cookie (double-submit; httpOnly to prevent JS access)
    res.cookies.set('csrf_token', csrfToken, {
      httpOnly: true,
      sameSite: 'strict',
      secure: isSecure,
      path: '/',
      maxAge: 60 * 60 // 1 hour
    });
    // Session refresh token (30 days maxAge)
    res.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      sameSite: 'strict',
      secure: isSecure,
      path: '/',
      maxAge: 60 * 60 * 24 * 30 // 30 days
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
          .catch(() => { })
          .finally(() => clearTimeout(to));
      }
    } catch { }

    return res;
  } catch (e: any) {
    return handleError(e, req);
  }
}
