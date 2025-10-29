import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateToken, verifyRefreshToken, determineRole, generateRefreshToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const isProd = process.env.NODE_ENV === 'production';
    const refresh = req.cookies.get('refresh_token')?.value;
    if (!refresh) {
      const res = NextResponse.json({ message: 'No refresh token' }, { status: 401 });
      res.cookies.delete('access_token');
      res.cookies.delete('refresh_token');
      return res;
    }

    let userId: number;
    try {
      const payload = verifyRefreshToken(refresh);
      userId = payload.id;
    } catch {
      const res = NextResponse.json({ message: 'Invalid refresh token' }, { status: 401 });
      res.cookies.delete('access_token');
      res.cookies.delete('refresh_token');
      return res;
    }

    const user = await (prisma as any).users.findUnique({ where: { id: userId } });
    if (!user) {
      const res = NextResponse.json({ message: 'User not found' }, { status: 404 });
      res.cookies.delete('access_token');
      res.cookies.delete('refresh_token');
      return res;
    }

    const dept = (user as any).department ?? null;
    const deptLower = dept ? String(dept).toLowerCase() : null;
    const idNum = typeof user.id === 'bigint' ? Number(user.id) : (user.id as number);
    const role = determineRole(deptLower, user.name || '');

    const accessToken = generateToken({
      id: idNum,
      email: user.email,
      role,
      department: deptLower as any
    });
    const newRefresh = generateRefreshToken({ id: idNum });

    const redirectParam = req.nextUrl.searchParams.get('redirect');
    const doRedirect = redirectParam && redirectParam.startsWith('/') ? redirectParam : null;
    const res = doRedirect
      ? NextResponse.redirect(new URL(doRedirect, req.nextUrl))
      : NextResponse.json({ ok: true });
    res.cookies.set('access_token', accessToken, {
      httpOnly: true,
      sameSite: 'strict',
      secure: isProd,
      path: '/',
      maxAge: 60 * 15
    });
    // rotate refresh
    res.cookies.set('refresh_token', newRefresh, {
      httpOnly: true,
      sameSite: 'strict',
      secure: isProd,
      path: '/'
    });

    return res;
  } catch (e: any) {
    return NextResponse.json({ message: 'Refresh error', details: e.message }, { status: 500 });
  }
}
