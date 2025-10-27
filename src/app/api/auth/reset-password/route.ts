import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

const OTP_TTL_MINUTES = Number(process.env.OTP_TTL_MINUTES || 15);

export async function POST(req: NextRequest) {
  try {
    const { email, otp, newPassword } = await req.json();
    if (!email || !otp || !newPassword) {
      return NextResponse.json({ message: 'Email, OTP and newPassword are required' }, { status: 400 });
    }

    const rec = await (prisma as any).password_reset_tokens.findUnique({ where: { email } });
    if (!rec || String(rec.token) !== String(otp)) {
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
    return NextResponse.json({ message: 'Reset error', details: e?.message }, { status: 500 });
  }
}
