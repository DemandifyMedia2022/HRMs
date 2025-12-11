import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ message: 'Logged out' });
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const isSecure = baseUrl.startsWith('https://');
  const cookieOptions = {
    httpOnly: true,
    sameSite: 'strict' as const,
    secure: isSecure,
    path: '/',
    maxAge: 0
  };

  res.cookies.set('access_token', '', cookieOptions);
  res.cookies.set('refresh_token', '', cookieOptions);

  return res;
}
