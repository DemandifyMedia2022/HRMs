import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { year, month } = await req.json();
    const y = Number(year);
    const m = Number(month);
    if (!y || !m || m < 1 || m > 12) {
      return NextResponse.json({ success: false, error: 'Valid year and month are required' }, { status: 400 });
    }

    // Optional: authorization check (admin only)
    // If you have roles in the session, enforce here. For now we assume requireAuth gates adequately.

    const existing = await prisma.attendance_freeze.findUnique({ where: { year_month: { year: y, month: m } as any } });
    if (!existing || !existing.is_frozen) {
      return NextResponse.json({ success: false, error: 'Month is not frozen' }, { status: 400 });
    }

    await prisma.attendance_freeze.update({
      where: { year_month: { year: y, month: m } as any },
      data: { is_frozen: false, updated_at: new Date() },
    });

    return NextResponse.json({ success: true, message: `Unfrozen ${y}-${String(m).padStart(2, '0')}` });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Unfreeze failed' }, { status: 500 });
  }
}
