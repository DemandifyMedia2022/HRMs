import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Build events for calendar from npattendance
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const yearParam = url.searchParams.get('year');
    const year = yearParam ? Number(yearParam) : new Date().getFullYear();
    if (!Number.isFinite(year)) {
      return NextResponse.json({ error: 'Invalid year' }, { status: 400 });
    }

    const startOfYear = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
    const endOfYear = new Date(Date.UTC(year, 11, 31, 23, 59, 59));

    // Use raw SQL to join users (users.emp_code = npattendance.employee_id)
    // Fields selected mirror NpAttendance plus users.Full_name
    const records: Array<any> = await prisma.$queryRaw`
      SELECT 
        a.id,
        a.employee_id AS employeeId,
        a.emp_name    AS empName,
        a.date        AS date,
        a.in_time     AS inTime,
        a.out_time    AS outTime,
        a.clock_times AS clockTimes,
        a.total_hours AS totalHours,
        a.login_hours AS loginHours,
        a.break_hours AS breakHours,
        a.status      AS status,
        u.Full_name   AS fullName
      FROM npattendance a
      LEFT JOIN users u ON u.emp_code = a.employee_id
      WHERE a.date BETWEEN ${startOfYear} AND ${endOfYear}
      ORDER BY a.employee_id ASC, a.date ASC
    `;

    // Group by employeeId
    const byUser: Record<string, any[]> = {};
    for (const r of records) {
      const dateISO = new Date(r.date).toISOString().split('T')[0];
      const inTime = r.inTime ? new Date(r.inTime).toISOString().substring(11, 19) : 'N/A';
      const outTime = r.outTime ? new Date(r.outTime).toISOString().substring(11, 19) : 'N/A';

      const event = {
        title: r.status || '—',
        start: `${dateISO}T00:00:00`,
        textColor: 'black',
        backgroundColor: 'transparent',
        borderColor: (r.status === 'Present') ? 'green' : (r.status === 'Absent') ? 'red' : (r.status === 'Half-day') ? 'orange' : 'gray',
        extendedProps: {
          user: r.fullName || r.empName || 'Unknown',
          emp_code: String(r.employeeId),
          date: dateISO,
          in_time: inTime,
          out_time: outTime,
          shift_time: r.shiftTime ?? null,
          login_hours: r.loginHours ?? '00:00:00',
          total_hours: r.totalHours ?? '00:00:00',
          break_hours: r.breakHours ?? '00:00:00',
          status: r.status ?? '',
          clock_times: r.clockTimes ?? '[]',
        },
      };
      const key = String(r.employeeId);
      if (!byUser[key]) byUser[key] = [];
      byUser[key].push(event);
    }

    // Fetch approved leaves overlapping the year window
    let leavesRaw: Array<any> = [];
    try {
      leavesRaw = await prisma.$queryRaw`
        SELECT 
          l.emp_code    AS empCode,
          l.leave_type  AS leaveType,
          l.start_date  AS startDate,
          l.end_date    AS endDate,
          u.Full_name   AS fullName
        FROM leavedata l
        JOIN users u ON u.emp_code = l.emp_code
        WHERE DATE(l.start_date) <= ${endOfYear}
          AND DATE(l.end_date)   >= ${startOfYear}
          AND l.HRApproval = 'Approved'
          AND l.ManagerApproval = 'Approved'
      `;
    } catch (err: any) {
      const msg = typeof err?.message === 'string' ? err.message : '';
      if (!msg.includes('leavedata')) {
        throw err;
      }
    }

    // Expand leaves to per-day entries within the year window
    const leavesByUser: Record<string, { date: string; leave_type: string; user: string }[]> = {};
    for (const row of leavesRaw) {
      const emp = String(row.empCode);
      const start = new Date(row.startDate);
      const end = new Date(row.endDate);
      // clamp to year range
      let cur = new Date(Math.max(start.getTime(), startOfYear.getTime()));
      const endClamp = new Date(Math.min(end.getTime(), endOfYear.getTime()));
      while (cur.getTime() <= endClamp.getTime()) {
        const iso = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth(), cur.getUTCDate())).toISOString().split('T')[0];
        if (!leavesByUser[emp]) leavesByUser[emp] = [];
        leavesByUser[emp].push({ date: iso, leave_type: row.leaveType || 'Leave', user: row.fullName || '' });
        cur = new Date(cur.getTime() + 24 * 60 * 60 * 1000);
      }
    }

    // Create response list grouped per user, attach leaves array
    const result = Object.entries(byUser).map(([employeeId, events]) => ({
      employeeId,
      employeeName: events[0]?.extendedProps?.user || 'Unknown',
      events,
      leaves: leavesByUser[employeeId] || [],
    }));

    // Fetch holidays/events from crud_events within the year window
    let holidaysRaw: Array<any> = [];
    try {
      holidaysRaw = await prisma.$queryRaw`
        SELECT 
          event_name   AS eventName,
          event_date   AS eventDate,
          event_end    AS eventEnd,
          event_start  AS eventStart
        FROM crud_events
        WHERE DATE(event_date) <= ${endOfYear}
          AND DATE(COALESCE(event_end, event_date)) >= ${startOfYear}
      `;
    } catch (err: any) {
      const msg = typeof err?.message === 'string' ? err.message : '';
      if (!msg.includes('crud_events')) {
        throw err;
      }
    }

    // Expand holidays to per-day entries
    const holidays: { date: string; event_name: string; event_start: string | null; event_end: string | null }[] = [];
    for (const h of holidaysRaw) {
      const start = new Date(h.eventDate);
      const end = new Date(h.eventEnd ?? h.eventDate);
      let cur = new Date(Math.max(start.getTime(), startOfYear.getTime()));
      const endClamp = new Date(Math.min(end.getTime(), endOfYear.getTime()));
      while (cur.getTime() <= endClamp.getTime()) {
        const iso = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth(), cur.getUTCDate())).toISOString().split('T')[0];
        holidays.push({
          date: iso,
          event_name: h.eventName ?? 'Holiday',
          event_start: h.eventStart ?? null,
          event_end: h.eventEnd ?? null,
        });
        cur = new Date(cur.getTime() + 24 * 60 * 60 * 1000);
      }
    }

    return NextResponse.json({ year, result, holidays });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
