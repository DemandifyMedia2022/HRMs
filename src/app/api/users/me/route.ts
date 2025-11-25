import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const user = await (prisma as any).users.findUnique({
      where: { id: auth.id },
      select: { id: true, name: true, email: true, type: true, department: true, Full_name: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const normalized = {
      id: typeof user.id === 'bigint' ? Number(user.id) : user.id,
      name: user.name,
      email: user.email,
      role: String(user.type || 'user').toLowerCase(),
      department: user.department,
      Full_name: user.Full_name
    };

    return NextResponse.json(normalized);
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to fetch user', details: e.message }, { status: 500 });
  }
}
