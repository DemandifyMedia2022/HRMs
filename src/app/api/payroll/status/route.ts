import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';
import { getMonthRange } from '@/lib/payroll';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const year = Number(searchParams.get('year'));
    const month = Number(searchParams.get('month'));
    if (!year || !month) {
      return NextResponse.json({ success: false, error: 'year and month are required' }, { status: 400 });
    }

    const freeze = await prisma.attendance_freeze.findUnique({ where: { year_month: { year, month } as any } });

    // Count snapshot rows for quick UI summary
    const { start, end } = getMonthRange(year, month);
    const employeeRows = await prisma.npattendance
      .findMany({
        where: { date: { gte: start, lt: end } },
        select: { employee_id: true },
        distinct: ['employee_id'] as any,
      })
      .catch(() => [] as Array<{ employee_id: string }>)
    const employeeCount = Array.isArray(employeeRows) ? employeeRows.length : 0;

    const snapshotCount = await prisma.payroll_attendance_snapshot.count({ where: { year, month } }).catch(() => 0);

    return NextResponse.json({
      success: true,
      data: {
        year,
        month,
        isFrozen: !!freeze?.is_frozen,
        frozenAt: freeze?.frozen_at ?? null,
        employeeCount,
        snapshotCount,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Failed to fetch status' }, { status: 500 });
  }
}
