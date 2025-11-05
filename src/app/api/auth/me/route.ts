import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, mapTypeToRole } from '@/lib/auth';
import { maybeEncryptForRequest } from '@/lib/crypto';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('access_token')?.value;
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token) as any;

    // fetch latest user info from DB (name/email/type/department)
    const user = await (prisma as any).users.findUnique({ where: { email: payload.email } });
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    // Determine role strictly from DB `type` column
    const dept = (user as any).department ?? null;
    const deptLower = dept ? String(dept).toLowerCase() : null;
    const idNum = typeof user.id === 'bigint' ? Number(user.id) : user.id;

    const role = mapTypeToRole((user as any).type);

    const res = NextResponse.json(
      maybeEncryptForRequest(req.headers, {
        role,
        name: (user as any).name ?? null,
        email: (user as any).email ?? null,
        department: (user as any).department ?? null
      })
    );

    // Refresh the token cookie to keep session alive
    const isProd = process.env.NODE_ENV === 'production';
    res.cookies.set('access_token', token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: isProd,
      path: '/',
      maxAge: 60 * 60 // 1 hour - refresh the expiration
    });

    return res;
  } catch (e: any) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
}
