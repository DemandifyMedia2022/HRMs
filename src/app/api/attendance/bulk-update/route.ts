import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type BulkUpdateBody = {
  emp_code?: string;
  status?: string;
  selected_dates?: string[];
};

function toUtcMidnight(dateStr: string): Date {
  // Normalize to UTC midnight to match MySQL DATE semantics
  const [y, m, d] = dateStr.split('-').map(n => Number(n));
  return new Date(Date.UTC(y, (m as number) - 1, d));
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as BulkUpdateBody;
    const empCode = (body.emp_code || '').trim();
    const status = (body.status || '').trim();
    const selectedDates = Array.isArray(body.selected_dates) ? body.selected_dates : [];

    if (!empCode || !status || selectedDates.length === 0) {
      return NextResponse.json(
        { success: false, message: 'emp_code, status and selected_dates are required.' },
        { status: 400 }
      );
    }

    const userRows: Array<{ name: string | null }> = await prisma.$queryRaw`
      SELECT COALESCE(Full_name, name) AS name
      FROM users
      WHERE emp_code = ${empCode}
      LIMIT 1
    `;

    const empName = userRows?.[0]?.name || '';

    let updated = 0;
    let inserted = 0;

    // Single pass: check existence first to get accurate counts
    for (const ds of selectedDates) {
      if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(ds)) continue;
      const date = toUtcMidnight(ds);
      // Try updating first; if no row updated, create
      const upd = await prisma.npAttendance.updateMany({
        where: { employeeId: String(empCode), date },
        data: { status }
      });
      if (upd.count && upd.count > 0) {
        updated += upd.count;
        continue;
      }
      try {
        await prisma.npAttendance.create({
          data: {
            employeeId: String(empCode),
            empName: empName,
            date,
            inTime: date,
            outTime: date,
            clockTimes: '[]',
            totalHours: '00:00:00',
            loginHours: '00:00:00',
            breakHours: '00:00:00',
            status
          }
        });
        inserted++;
      } catch {
        // Likely unique constraint due to a concurrent insert; fallback to update
        const upd2 = await prisma.npAttendance.updateMany({
          where: { employeeId: String(empCode), date },
          data: { status }
        });
        if (upd2.count > 0) updated += upd2.count;
      }
    }

    return NextResponse.json({ success: true, updated, inserted });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e?.message || 'Error' }, { status: 500 });
  }
}
