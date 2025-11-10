import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { handleError } from '@/lib/error-handler';
import crypto from 'crypto';

const OTP_TTL_MINUTES = Number(process.env.OTP_TTL_MINUTES || 15);

function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (password.length < 8) errors.push('Password must be at least 8 characters long');
  if (!/[a-z]/.test(password)) errors.push('Password must contain at least one lowercase letter');
  if (!/[A-Z]/.test(password)) errors.push('Password must contain at least one uppercase letter');
  if (!/[0-9]/.test(password)) errors.push('Password must contain at least one number');
  if (!/[^a-zA-Z0-9]/.test(password)) errors.push('Password must contain at least one special character');
  const common = ['password', '12345678', 'qwerty', 'abc123'];
  if (common.some(c => password.toLowerCase().includes(c))) errors.push('Password is too common');
  return { valid: errors.length === 0, errors };
}

export async function POST(req: NextRequest) {
  try {
    const { email, otp, newPassword } = await req.json();
    if (!email || !otp || !newPassword) {
      return NextResponse.json({ message: 'Email, OTP and newPassword are required' }, { status: 400 });
    }

    const rec = await (prisma as any).password_reset_tokens.findUnique({ where: { email } });
    if (!rec) {
      // Perform dummy constant-time op to reduce timing side-channel on unknown emails
      crypto.timingSafeEqual(Buffer.from('dummy'), Buffer.from('dummy'));
      return NextResponse.json({ message: 'Invalid OTP' }, { status: 400 });
    }

    function constantTimeEquals(a: string, b: string): boolean {
      if (a.length !== b.length) return false;
      const aBuf = Buffer.from(a, 'utf8');
      const bBuf = Buffer.from(b, 'utf8');
      return crypto.timingSafeEqual(aBuf, bBuf);
    }

    if (!constantTimeEquals(String(rec.token), String(otp))) {
      return NextResponse.json({ message: 'Invalid OTP' }, { status: 400 });
    }

    if (rec.created_at) {
      const created = new Date(rec.created_at as any);
      const ageMin = (Date.now() - created.getTime()) / 60000;
      if (ageMin > OTP_TTL_MINUTES) {
        // Cleanup expired
        await (prisma as any).password_reset_tokens.delete({ where: { email } }).catch(() => {});
        return NextResponse.json({ message: 'OTP expired' }, { status: 400 });
      }
    }

    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      return NextResponse.json(
        { message: 'Password does not meet requirements', errors: validation.errors },
        { status: 400 }
      );
    }

    const user = await (prisma as any).users.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const hashed = hashPassword(newPassword);

    await (prisma as any).users.update({ where: { email }, data: { password: hashed } });

    // Invalidate token
    await (prisma as any).password_reset_tokens.delete({ where: { email } }).catch(() => {});

    return NextResponse.json({ message: 'Password updated' });
  } catch (e: any) {
    return handleError(e, req);
  }
}
