import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function pickHHMM(raw: any): string {
  if (raw == null) return 'N/A';
  const s = String(raw);
  const m = s.match(/(\d{1,2}):(\d{2})(?::\d{2})?/);
  if (m) return `${m[1].padStart(2, '0')}:${m[2]}`;
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }
  return 'N/A';
}

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
        u.Full_name   AS fullName,
        s.shift_time  AS shiftTime
      FROM npattendance a
      LEFT JOIN users u ON u.emp_code = a.employee_id
      LEFT JOIN shift_time s ON s.biomatric_id = a.employee_id
      WHERE a.date BETWEEN ${startOfYear} AND ${endOfYear}
      ORDER BY a.employee_id ASC, a.date ASC
    `;

    // Group by employeeId
    const byUser: Record<string, any[]> = {};
    for (const r of records) {
      const dateISO = new Date(r.date).toISOString().split('T')[0];
      let inTime = pickHHMM(r.inTime);
      let outTime = pickHHMM(r.outTime);

      let ctArr: string[] | null = null;
      try {
        if (r.clockTimes) {
          const parsed = typeof r.clockTimes === 'string' ? JSON.parse(r.clockTimes) : r.clockTimes;
          if (Array.isArray(parsed) && parsed.length > 0) {
            ctArr = parsed.map((t: any) => pickHHMM(t)).filter((t: string) => t !== 'N/A');
          }
        }
      } catch {}
      if (ctArr && ctArr.length > 0) {
        inTime = ctArr[0] || inTime;
        outTime = ctArr[ctArr.length - 1] || outTime;
      }

      const event = {
        title: r.status || '—',
        start: `${dateISO}T00:00:00`,
        textColor: 'black',
        backgroundColor: 'transparent',
        borderColor:
          r.status === 'Present'
            ? 'green'
            : r.status === 'Absent'
              ? 'red'
              : r.status === 'Half-day'
                ? 'orange'
                : 'gray',
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
          clock_times: r.clockTimes ?? '[]'
        }
      };
      const key = String(r.employeeId);
      if (!byUser[key]) byUser[key] = [];
      byUser[key].push(event);
    }

    // Fetch approved leaves overlapping the year window
    const leavesRaw: Array<any> = await prisma.$queryRaw`
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
        const iso = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth(), cur.getUTCDate()))
          .toISOString()
          .split('T')[0];
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
      leaves: leavesByUser[employeeId] || []
    }));

    // Fetch holidays/events from crud_events within the year window
    const holidaysRaw: Array<any> = await prisma.$queryRaw`
      SELECT 
        event_name   AS eventName,
        event_date   AS eventDate,
        event_end    AS eventEnd,
        event_start  AS eventStart
      FROM crud_events
      WHERE DATE(event_date) <= ${endOfYear}
        AND DATE(COALESCE(event_end, event_date)) >= ${startOfYear}
    `;

    // Expand holidays to per-day entries (UTC date-only to avoid local tz shifts)
    const holidays: { date: string; event_name: string; event_start: string | null; event_end: string | null }[] = [];
    for (const h of holidaysRaw) {
      const s = new Date(h.eventDate);
      const e = new Date(h.eventEnd ?? h.eventDate);

      // Normalize to UTC midnight for start/end
      const startUTC = new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate()));
      const endUTC = new Date(Date.UTC(e.getUTCFullYear(), e.getUTCMonth(), e.getUTCDate()));

      // Clamp within the year window (already UTC)
      let cur = new Date(Math.max(startUTC.getTime(), startOfYear.getTime()));
      const endClamp = new Date(Math.min(endUTC.getTime(), endOfYear.getTime()));

      while (cur.getTime() <= endClamp.getTime()) {
        const iso = cur.toISOString().split('T')[0];
        holidays.push({
          date: iso,
          event_name: h.eventName ?? 'Holiday',
          event_start: h.eventStart ?? null,
          event_end: h.eventEnd ?? null
        });
        // add 1 day in UTC
        cur = new Date(cur.getTime() + 24 * 60 * 60 * 1000);
      }
    }

    return NextResponse.json({ year, result, holidays });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
