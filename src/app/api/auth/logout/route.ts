import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ message: 'Logged out' });
  const isProd = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    httpOnly: true,
    sameSite: 'strict' as const,
    secure: isProd,
    path: '/',
    maxAge: 0
  };

  res.cookies.set('access_token', '', cookieOptions);
  res.cookies.set('refresh_token', '', cookieOptions);

  return res;
}
