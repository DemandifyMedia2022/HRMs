import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ message: 'Logged out' });
  const isProd = process.env.NODE_ENV === 'production';
  res.cookies.set('access_token', '', {
    httpOnly: true,
    sameSite: 'strict',
    secure: isProd,
    path: '/',
    maxAge: 0
  });
  return res;
}
