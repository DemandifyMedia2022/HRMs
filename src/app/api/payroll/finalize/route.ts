import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';
import { getMonthRange } from '@/lib/payroll';

// Utility
function iso(d: Date) {
  return d.toISOString().split('T')[0];
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json().catch(() => ({}));
    const year = Number(body?.year);
    const month = Number(body?.month);

    if (!year || !month || month < 1 || month > 12) {
      return NextResponse.json({ success: false, error: 'Valid year and month are required' }, { status: 400 });
    }

    // Guard double-freeze
    const frozen = await prisma.attendance_freeze.findUnique({ where: { year_month: { year, month } as any } });
    if (frozen?.is_frozen) {
      return NextResponse.json({ success: false, error: 'Attendance already frozen for this month' }, { status: 409 });
    }

    const { start, end } = getMonthRange(year, month);
    const totalDays = new Date(year, month, 0).getDate();
    const allDates: string[] = Array.from({ length: totalDays }, (_, i) => iso(new Date(year, month - 1, i + 1)));

    // Holidays within month
    const holidays = await prisma.crud_events.findMany({
      where: { event_date: { gte: start, lt: end } },
      select: { event_date: true },
    });
    const holidaySet = new Set(
      holidays
        .map((h: { event_date: Date | null }) => h.event_date && iso(h.event_date))
        .filter(Boolean) as string[]
    );

    // Attendance rows for month
    const att = await prisma.npattendance.findMany({
      where: { date: { gte: start, lt: end } },
      select: { employee_id: true, date: true, status: true },
      orderBy: [{ employee_id: 'asc' }, { date: 'asc' }],
    });

    if (att.length === 0) {
      return NextResponse.json({ success: false, error: 'No attendance found for this period' }, { status: 404 });
    }

    // Group attendance by employee
    const byEmp = new Map<string, { dates: Map<string, string> }>();
    for (const r of att) {
      const emp = r.employee_id;
      const d = iso(r.date);
      if (!byEmp.has(emp)) byEmp.set(emp, { dates: new Map() });
      byEmp.get(emp)!.dates.set(d, (r.status || '').trim());
    }

    const empCodes = Array.from(byEmp.keys());

    // Approved leaves in month for these employees
    const leaves = await prisma.leavedata.findMany({
      where: {
        emp_code: { in: empCodes },
        HRapproval: 'Approved',
        Managerapproval: 'Approved',
        OR: [{ start_date: { gte: start, lt: end } }, { end_date: { gte: start, lt: end } }],
      },
      select: { emp_code: true, leave_type: true, start_date: true, end_date: true },
    });

    const paidLeaveTypes = new Set(['Paid Leave', 'work From Home', 'Sick Leave(FullDay)', 'Sick Leave(HalfDay)']);
    const unpaidLeaveTypes = new Set(['Absent (Unpaid)']);

    // Compute snapshots
    type UpsertArg = Parameters<typeof prisma.payroll_attendance_snapshot.upsert>[0];
    const snapshots: UpsertArg[] = [];

    for (const emp of empCodes) {
      const rec = byEmp.get(emp)!;
      const presentSet = new Set<string>(Array.from(rec.dates.keys()));
      let present = 0;
      let leave = 0;
      let lop = 0;

      // Present from attendance (holidays are paid)
      for (const [d, s] of rec.dates) {
        const isHoliday = holidaySet.has(d);
        if (s === 'Half-day' && !isHoliday) present += 0.5;
        else if (s && !isHoliday) present += 1;
        else if (isHoliday) present += 1;
      }

      // Weekends/holidays missing records -> paid
      for (const d of allDates) {
        if (presentSet.has(d)) continue;
        const date = new Date(d);
        const dow = date.getDay();
        if (holidaySet.has(d) || dow === 0 || dow === 6) {
          present += 1;
        }
      }

      // Paid leaves not already represented in attendance
      const empPaidLeaves = leaves.filter(
        (l: { emp_code: string | null; leave_type: string | null; start_date: Date; end_date: Date }) =>
          l.emp_code === emp && paidLeaveTypes.has(l.leave_type || '')
      );
      for (const l of empPaidLeaves) {
        const s = new Date(l.start_date);
        const e = new Date(l.end_date);
        for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
          if (d < start || d >= end) continue;
          const dStr = iso(d);
          if (presentSet.has(dStr)) continue;
          if (holidaySet.has(dStr)) continue;
          const dow = d.getDay();
          if (dow === 0 || dow === 6) continue;
          if (l.leave_type === 'Sick Leave(HalfDay)') leave += 0.5;
          else leave += 1;
        }
      }

      // Unpaid leaves (LOP) not already represented in attendance
      const empUnpaidLeaves = leaves.filter(
        (l: { emp_code: string | null; leave_type: string | null; start_date: Date; end_date: Date }) =>
          l.emp_code === emp && unpaidLeaveTypes.has(l.leave_type || '')
      );
      for (const l of empUnpaidLeaves) {
        const s = new Date(l.start_date);
        const e = new Date(l.end_date);
        for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
          if (d < start || d >= end) continue;
          const dStr = iso(d);
          if (presentSet.has(dStr)) continue;
          if (holidaySet.has(dStr)) continue;
          const dow = d.getDay();
          if (dow === 0 || dow === 6) continue;
          // currently no half-day unpaid variant provided
          lop += 1;
        }
      }

      const workingDays = allDates.filter(d => {
        const dt = new Date(d);
        const dow = dt.getDay();
        return !(dow === 0 || dow === 6) && !holidaySet.has(d);
      }).length;

      const paid = present + leave;
      const absent = Math.max(0, workingDays - (paid + lop));

      snapshots.push({
        where: { employee_id_year_month: { employee_id: emp, year, month } as any },
        update: {
          present_days: Number(present) as any,
          absent_days: Number(absent) as any,
          leave_days: Number(leave) as any,
          lop_days: Number(lop) as any,
          total_working_days: workingDays,
          updated_at: new Date(),
        },
        create: {
          employee_id: emp,
          year,
          month,
          present_days: Number(present) as any,
          absent_days: Number(absent) as any,
          leave_days: Number(leave) as any,
          lop_days: Number(lop) as any,
          total_working_days: workingDays,
        },
      });
    }

    // Freeze + write snapshots atomically
    await prisma.$transaction(async (tx: any) => {
      await tx.attendance_freeze.upsert({
        where: { year_month: { year, month } as any },
        update: { is_frozen: true, frozen_at: new Date(), updated_at: new Date() },
        create: { year, month, is_frozen: true, frozen_at: new Date() },
      });

      for (const s of snapshots) {
        await tx.payroll_attendance_snapshot.upsert(s as any);
      }
    });

    return NextResponse.json({
      success: true,
      data: { year, month, employees: snapshots.length },
      message: `Finalized ${year}-${String(month).padStart(2, '0')} for ${snapshots.length} employees`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Finalize failed' }, { status: 500 });
  }
}
