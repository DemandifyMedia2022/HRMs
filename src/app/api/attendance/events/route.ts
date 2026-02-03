import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function parseTimeToSeconds(raw: any): number {
  if (raw == null) return 0;
  if (raw instanceof Date) {
    return raw.getUTCHours() * 3600 + raw.getUTCMinutes() * 60 + raw.getUTCSeconds();
  }
  const s = String(raw);
  const m = s.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (m) {
    return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3] || 0);
  }
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    return d.getUTCHours() * 3600 + d.getUTCMinutes() * 60 + d.getUTCSeconds();
  }
  return 0;
}

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

function toISTDateOnly(d: Date): string {
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

function parseDateOnlyToUTC(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(n => parseInt(n, 10));
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1, 0, 0, 0));
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

    // Fetch users for name mapping and emp_code -> biometric_id mapping
    const users = await prisma.users.findMany({
      select: { emp_code: true, Full_name: true, Biometric_id: true },
    });
    const biometricToName = new Map<string, string>();
    const empCodeToBiometric = new Map<string, string>();
    users.forEach((u: any) => {
      const bio = u.Biometric_id !== null && u.Biometric_id !== undefined ? String(u.Biometric_id).trim() : '';
      const emp = u.emp_code ? String(u.emp_code).trim() : '';
      if (bio) biometricToName.set(bio, u.Full_name || 'Unknown');
      if (emp && bio) empCodeToBiometric.set(emp, bio);
    });

    const records = await prisma.npattendance.findMany({
      where: {
        date: {
          gte: startOfYear,
          lte: endOfYear
        }
      },
      orderBy: [
        { employee_id: 'asc' },
        { date: 'asc' }
      ]
    });

    // Group by employeeId
    const byUser: Record<string, any[]> = {};
    for (const r of records) {
      const dateISO = new Date(r.date).toISOString().split('T')[0];

      // r.in_time etc are Date objects. helper pickHHMM handles them.
      let inTime = pickHHMM(r.in_time);
      let outTime = pickHHMM(r.out_time);

      let ctArr: string[] | null = null;
      try {
        if (r.clock_times) {
          const parsed = typeof r.clock_times === 'string' ? JSON.parse(r.clock_times) : r.clock_times;
          if (Array.isArray(parsed) && parsed.length > 0) {
            ctArr = parsed.map((t: any) => pickHHMM(t)).filter((t: string) => t !== 'N/A');
          }
        }
      } catch { }
      if (ctArr && ctArr.length > 0) {
        inTime = ctArr[0] || inTime;
        outTime = ctArr[ctArr.length - 1] || outTime;
      }

      let calculatedStatus = r.status || '';
      // Parse login_hours (which is DateTime in Prisma)
      const loginSec = parseTimeToSeconds(r.login_hours);

      if (!calculatedStatus || calculatedStatus === 'Absent') {
        if (loginSec >= 8 * 3600) {
          calculatedStatus = 'Present';
        } else if (loginSec >= 4 * 3600) {
          calculatedStatus = 'Half-day';
        }
      }

      const empKey = String(r.employee_id ?? '').trim();
      const empName = biometricToName.get(empKey) || r.emp_name || 'Unknown';

      // Access login_hours safely safely (handle null)
      const loginHoursStr = r.login_hours ? new Date(r.login_hours).toISOString().substr(11, 8) : '00:00:00';
      const totalHoursStr = r.total_hours ? new Date(r.total_hours).toISOString().substr(11, 8) : '00:00:00';
      const breakHoursStr = r.break_hours ? new Date(r.break_hours).toISOString().substr(11, 8) : '00:00:00';

      const event = {
        title: calculatedStatus || '—',
        start: `${dateISO}T00:00:00`,
        textColor: 'black',
        backgroundColor: 'transparent',
        borderColor:
          calculatedStatus.toLowerCase().startsWith('present')
            ? 'green'
            : calculatedStatus.toLowerCase().startsWith('absent')
              ? 'red'
              : calculatedStatus.toLowerCase().includes('half')
                ? 'orange'
                : 'gray',
        extendedProps: {
          user: empName,
          emp_code: String(r.employee_id),
          date: dateISO,
          in_time: inTime,
          out_time: outTime,
          shift_time: r.shift_time ?? null,
          login_hours: loginHoursStr,
          total_hours: totalHoursStr,
          break_hours: breakHoursStr,
          status: calculatedStatus,
          clock_times: r.clock_times ?? '[]'
        }
      };

      // Recalculate hours for today to match live dashboard
      // Use IST to determine "today"
      const todayIST = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

      if (dateISO === todayIST && r.clock_times) {
        try {
          const clockTimes = typeof r.clock_times === 'string' ? JSON.parse(r.clock_times) : r.clock_times;
          if (Array.isArray(clockTimes) && clockTimes.length > 0) {
            const now = Date.now();
            const timestamps = clockTimes.map((t: string) => {
              const [hh, mm] = t.split(':').map(str => str.padStart(2, '0'));
              // Construct ISO string explicitly with IST offset (+05:30)
              const isoString = `${dateISO}T${hh}:${mm}:00+05:30`;
              return new Date(isoString).getTime();
            }).sort((a, b) => a - b);

            const firstPunch = timestamps[0];
            const lastPunch = timestamps[timestamps.length - 1];

            // Check if ongoing (odd punches)
            const isOngoing = timestamps.length % 2 !== 0;
            const currentOutTime = isOngoing ? now : lastPunch;

            let workingMs = 0;
            for (let i = 0; i < timestamps.length - 1; i += 2) {
              if (timestamps[i + 1]) {
                workingMs += timestamps[i + 1] - timestamps[i];
              }
            }
            if (isOngoing) {
              workingMs += now - lastPunch;
            }

            const totalMs = currentOutTime - firstPunch;
            const breakMs = Math.max(0, totalMs - workingMs);

            const formatDuration = (ms: number) => {
              const totalSeconds = Math.max(0, Math.floor(ms / 1000));
              const hours = Math.floor(totalSeconds / 3600);
              const minutes = Math.floor((totalSeconds % 3600) / 60);
              const seconds = totalSeconds % 60;
              return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            };

            event.extendedProps.login_hours = formatDuration(workingMs);
            event.extendedProps.total_hours = formatDuration(totalMs);
            event.extendedProps.break_hours = formatDuration(breakMs);

            const workingSeconds = workingMs / 1000;
            if (workingSeconds >= 8 * 3600) {
              event.extendedProps.status = 'Present';
              event.title = 'Present';
              event.borderColor = 'green';
            } else if (workingSeconds >= 4 * 3600) {
              event.extendedProps.status = 'Half-day';
              event.title = 'Half-day';
              event.borderColor = 'orange';
            }

            if (isOngoing) {
              // Show out time for ongoing shift in IST
              const d = new Date(now);
              const dIST = new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
              const hh = String(dIST.getHours()).padStart(2, '0');
              const mm = String(dIST.getMinutes()).padStart(2, '0');
              event.extendedProps.out_time = `${hh}:${mm}`;
            }
          }
        } catch (e) {
          console.error('Error recalculating today hours:', e);
        }
      }

      const key = String(r.employee_id ?? '').trim();
      if (!byUser[key]) byUser[key] = [];
      byUser[key].push(event);
    }

    // Fetch approved leaves overlapping the year window.
    // NOTE: leavedata.emp_code is often NULL in existing rows, so we also match via added_by_user.
    const leavesRaw: Array<any> = await prisma.$queryRaw`
      SELECT 
        l.emp_code       AS empCode,
        l.added_by_user  AS addedByUser,
        l.leave_type     AS leaveType,
        l.start_date     AS startDate,
        l.end_date       AS endDate,
        u.Full_name      AS fullName,
        u.Biometric_id   AS biometricId
      FROM leavedata l
      JOIN users u ON (
        (l.emp_code IS NOT NULL AND CONVERT(u.emp_code USING utf8mb4) COLLATE utf8mb4_unicode_ci = CONVERT(l.emp_code USING utf8mb4) COLLATE utf8mb4_unicode_ci)
        OR (
          l.added_by_user IS NOT NULL AND (
            CONVERT(u.Full_name USING utf8mb4) COLLATE utf8mb4_unicode_ci = CONVERT(l.added_by_user USING utf8mb4) COLLATE utf8mb4_unicode_ci
            OR CONVERT(u.name USING utf8mb4) COLLATE utf8mb4_unicode_ci = CONVERT(l.added_by_user USING utf8mb4) COLLATE utf8mb4_unicode_ci
            OR CONVERT(u.email USING utf8mb4) COLLATE utf8mb4_unicode_ci = CONVERT(l.added_by_user USING utf8mb4) COLLATE utf8mb4_unicode_ci
          )
        )
      )
      WHERE DATE(l.start_date) <= ${endOfYear}
        AND DATE(l.end_date)   >= ${startOfYear}
        AND LOWER(COALESCE(l.HRapproval, '')) = 'approved'
        AND LOWER(COALESCE(l.Managerapproval, '')) = 'approved'
    `;

    // Expand leaves to per-day entries within the year window
    const leavesByUser: Record<string, { date: string; leave_type: string; user: string }[]> = {};
    for (const row of leavesRaw) {
      const bio = row.biometricId !== null && row.biometricId !== undefined ? String(row.biometricId).trim() : '';
      const empCode = row.empCode ? String(row.empCode).trim() : '';
      // Attendance calendars are keyed by npattendance.employee_id (biometric id).
      const emp = bio || (empCodeToBiometric.get(empCode) || empCode);
      if (!emp) continue;

      // IMPORTANT: Expand by *IST date-only* to avoid off-by-one issues when DB stores midnight IST.
      const startStr = toISTDateOnly(new Date(row.startDate));
      const endStr = toISTDateOnly(new Date(row.endDate));
      const start = parseDateOnlyToUTC(startStr);
      const end = parseDateOnlyToUTC(endStr);

      // clamp to year range (UTC)
      let cur = new Date(Math.max(start.getTime(), startOfYear.getTime()));
      const endClamp = new Date(Math.min(end.getTime(), endOfYear.getTime()));

      while (cur.getTime() <= endClamp.getTime()) {
        const iso = cur.toISOString().split('T')[0];
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