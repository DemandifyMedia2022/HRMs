import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendMail } from '@/lib/mailer';
import crypto from 'crypto';

function generateOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    const user = await (prisma as any).users.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ message: 'If the email exists, an OTP has been sent.' });
    }

    const otp = generateOtp();

    await (prisma as any).password_reset_tokens.upsert({
      where: { email },
      update: { token: otp, created_at: new Date() },
      create: { email, token: otp, created_at: new Date() }
    });

    const appName = process.env.MAIL_FROM_NAME || 'HRMS';
    const html = `
      <div style="font-family:ui-sans-serif,system-ui,-apple-system;max-width:520px;margin:auto">
        <h2>${appName}: Password reset OTP</h2>
        <p>Your one-time password (OTP) is:</p>
        <p style="font-size:28px;letter-spacing:4px;font-weight:700;margin:16px 0">${otp}</p>
        <p>This code will expire in 15 minutes. If you did not request this, you can ignore this email.</p>
        <p>
          Or open the reset page and paste the code: 
          <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/reset-password" target="_blank">Reset Password</a>
        </p>
      </div>
    `;

    const res = await sendMail({ to: [email], subject: `${appName}: Password reset OTP`, html });
    if (!res.ok) {
      return NextResponse.json({ message: 'Failed to send email', error: res.error }, { status: 500 });
    }

    return NextResponse.json({ message: 'OTP sent if the email exists' });
  } catch (e: any) {
    return NextResponse.json({ message: 'Request error', details: e?.message }, { status: 500 });
  }
}
