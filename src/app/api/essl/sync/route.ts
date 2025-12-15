import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/logger';
import axios from 'axios';

const logger = createLogger('API:ESSL-Sync');

interface AttendanceRecord {
  employeeID: string;
  cycleDate: string;
  timestamps: number[];
}

export async function POST(request: NextRequest) {
  try {
    // Get body
    const body = await request.json().catch(() => ({}));
    const overwriteShift: boolean = Boolean(body.overwriteShift) || (String(process.env.ESSL_OVERWRITE_SHIFT || '').trim() === '1');

    // If a JSON URL is provided, run JSON mode (Laravel fetchAttendanceData equivalent)
    const jsonUrl: string | null = body.url || request.nextUrl.searchParams.get('url');
    if (jsonUrl) {
      return await handleJsonAttendance(jsonUrl, overwriteShift);
    }

    // SOAP mode: Get date range from request or use dynamic defaults
    // Default from: latest attendance date (00:00:00); if none, yesterday 00:00:00
    const lastRecord = await prisma.npattendance.findFirst({
      orderBy: { date: 'desc' },
      select: { date: true },
    });
    const now = new Date();
    const fallbackFrom = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    fallbackFrom.setHours(0, 0, 0, 0);
    const baseFrom = lastRecord ? new Date(lastRecord.date) : fallbackFrom;
    baseFrom.setHours(0, 0, 0, 0);
    const lookbackDaysEnv = Number(process.env.ESSL_LOOKBACK_DAYS || 0);
    const lookbackDaysBody = Number(body.lookbackDays || 0);
    const lookbackDays = (Number.isFinite(lookbackDaysBody) && lookbackDaysBody > 0)
      ? lookbackDaysBody
      : ((Number.isFinite(lookbackDaysEnv) && lookbackDaysEnv > 0) ? lookbackDaysEnv : 0);
    if (!body.fromDate && lookbackDays > 0) {
      baseFrom.setDate(baseFrom.getDate() - lookbackDays);
    }
    // ESSL Configuration from environment variables
    const serverUrl = process.env.ESSL_SERVER_URL!;
    const serialNumber = process.env.ESSL_SERIAL_NUMBER!;
    const username = process.env.ESSL_USERNAME!;
    const password = process.env.ESSL_PASSWORD!;

    const fromDate = body.fromDate || formatLocalDateTime(baseFrom);

    // Fix: ESSL device expects local time (IST). Our Docker container is UTC.
    // If we send utc-time "formatLocalDateTime(now)" for "toDate", we miss recent punches (5.5h gap).
    // So for "now", explicitly convert to IST string.
    let toDate = body.toDate;
    if (!toDate || (typeof toDate === 'string' && toDate.toLowerCase() === 'now')) {
      toDate = formatISTDateTime(new Date());
    }

    logger.info('Starting ESSL Sync', {
      lookbackDays,
      baseFrom: formatLocalDateTime(baseFrom),
      fromDate,
      toDate,
      note: 'toDate converted to IST to match device clock'
    });

    // Build SOAP XML request
    const xmlPostString = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <GetTransactionsLog xmlns="http://tempuri.org/">
      <FromDateTime>${fromDate}</FromDateTime>
      <ToDateTime>${toDate}</ToDateTime>
      <SerialNumber>${serialNumber}</SerialNumber>
      <UserName>${username}</UserName>
      <UserPassword>${password}</UserPassword>
      <strDataList></strDataList>
    </GetTransactionsLog>
  </soap:Body>
</soap:Envelope>`;

    // Make SOAP request to ESSL device
    const response = await axios.post(serverUrl, xmlPostString, {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': '"http://tempuri.org/GetTransactionsLog"',
      },
    });

    // Check if response is XML
    if (!response.data.includes('<?xml')) {
      logger.error('Non-XML response received', { responsePreview: response.data.substring(0, 500) });
      return NextResponse.json(
        { error: 'Non-XML response received', response: response.data },
        { status: 500 }
      );
    }

    const strDataList = extractStrDataList(response.data);
    if (strDataList === null) {
      logger.error('Failed to extract strDataList', { responsePreview: response.data.substring(0, 1000) });
      return NextResponse.json(
        {
          error: 'Failed to extract data from SOAP response',
          hint: 'Check server logs for response preview',
          responsePreview: response.data.substring(0, 500)
        },
        { status: 500 }
      );
    }

    // Handle empty data list (no attendance records in the time range)
    if (strDataList.trim() === '' || strDataList.trim().length === 0) {
      logger.info('No attendance records found in the specified time range', { fromDate, toDate });
      return NextResponse.json({
        success: true,
        message: 'No attendance records found in the specified time range',
        inserted: 0,
        updated: 0,
      });
    }

    const attendanceData = parseAttendanceData(strDataList);

    let insertedCount = 0;
    let updatedCount = 0;

    const minAllowedDate = new Date(`${fromDate.substring(0, 10)}T00:00:00`);

    const consumedByEmp = new Map<string, Set<number>>();
    const MAX_SHIFT_HOURS = Number(process.env.ESSL_MAX_SHIFT_HOURS || 16);
    const MAX_SHIFT_SECONDS = MAX_SHIFT_HOURS * 3600;

    for (const [employeeID, dates] of Object.entries(attendanceData)) {
      const employeeIdStr = String(employeeID).trim();
      const employeeIdNum = Number(employeeID);
      if (Number.isNaN(employeeIdNum)) continue;

      const consumed = (() => {
        const s = consumedByEmp.get(employeeIdStr);
        if (s) return s;
        const ns = new Set<number>();
        consumedByEmp.set(employeeIdStr, ns);
        return ns;
      })();

      const sortedDays = Object.keys(dates).sort();
      for (const cycleDate of sortedDays) {
        const dayStart = new Date(`${cycleDate}T00:00:00`);
        if (dayStart < minAllowedDate) continue;

        const todayTs = (dates[cycleDate] || []).slice();
        const nextDate = (() => {
          const d = new Date(`${cycleDate}T00:00:00`);
          d.setDate(d.getDate() + 1);
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          return `${yyyy}-${mm}-${dd}`;
        })();
        const nextDayTs = (dates[nextDate] || []).slice();
        const allTs = [...todayTs, ...nextDayTs]
          .filter((ts) => ts && ts > 0)
          .filter((ts) => !consumed.has(ts))
          .sort((a, b) => a - b);

        if (allTs.length === 0) continue;

        const firstTs = allTs[0];
        const windowEnd = firstTs + MAX_SHIFT_SECONDS;
        const windowTs = allTs.filter((ts) => ts >= firstTs && ts <= windowEnd);
        if (windowTs.length === 0) continue;

        for (const ts of windowTs) consumed.add(ts);

        const inTs = windowTs[0];
        const outTs = windowTs[windowTs.length - 1];
        const inTime = new Date(inTs * 1000);
        const outTime = new Date(outTs * 1000);

        const clockTimes = windowTs.map((ts) => {
          const date = new Date(ts * 1000);
          return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        });

        let workingSeconds = 0;
        for (let i = 0; i < windowTs.length - 1; i += 2) {
          if (windowTs[i + 1]) workingSeconds += windowTs[i + 1] - windowTs[i];
        }
        const totalSeconds = outTs - inTs;
        const breakSeconds = Math.max(0, totalSeconds - workingSeconds);

        const totalHoursDate = secondsToTimeDate(totalSeconds);
        const workingHoursDate = secondsToTimeDate(workingSeconds);
        const breakHoursDate = secondsToTimeDate(breakSeconds);

        const startDateStr = (() => {
          const d = new Date(inTs * 1000);
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          return `${yyyy}-${mm}-${dd}`;
        })();

        const existingRecord = await prisma.npattendance.findFirst({
          where: { employee_id: employeeIdStr, date: new Date(startDateStr) },
        });
        let resolvedShift: string | null = overwriteShift ? null : (existingRecord?.shift_time ?? null);
        if (!resolvedShift) {
          const shift = await prisma.shift_time.findFirst({
            where: { biomatric_id: employeeIdNum },
            select: { shift_time: true },
          });
          resolvedShift = shift?.shift_time ?? null;
        }

        let status = '';
        let statusNote: string[] = [];
        const baseStatus = workingSeconds >= 8 * 3600
          ? 'Present'
          : workingSeconds >= 4 * 3600
            ? 'Half-day'
            : 'Absent';
        if (!resolvedShift) {
          status = baseStatus;
        } else {
          const shiftParsed = parseShiftString(resolvedShift);
          if (!shiftParsed) {
            status = baseStatus;
          } else {
            const { startMinutes, endMinutes } = shiftParsed;

            const day = new Date(inTs * 1000);
            const startDate = new Date(day);
            startDate.setHours(0, 0, 0, 0);
            startDate.setMinutes(startMinutes);
            const endDate = new Date(day);
            endDate.setHours(0, 0, 0, 0);
            endDate.setMinutes(endMinutes);
            if (endDate <= startDate) {
              endDate.setDate(endDate.getDate() + 1);
            }

            const lateThreshold = new Date(startDate.getTime() + 15 * 60 * 1000);
            const earlyThreshold = new Date(endDate.getTime() - 15 * 60 * 1000);

            const isLate = inTime > lateThreshold;
            const isEarly = outTime < earlyThreshold;

            status = baseStatus;

            if (isLate) {
              if (workingSeconds >= 8 * 3600 && status === 'Present') {
                statusNote.push('Late');
              } else if (status !== 'Absent') {
                statusNote.push('Late');
              }
            }

            if (isEarly) {
              if (workingSeconds >= 8 * 3600) {
                status = 'Present';
                statusNote.push('Early');
              } else if (workingSeconds >= 4 * 3600) {
                status = 'Half-day';
                statusNote.push('Early');
              } else {
                status = 'Absent';
              }
            }
          }
        }

        const nowSec = Math.floor(Date.now() / 1000);
        const isOngoing = nowSec >= inTs && nowSec <= windowEnd;
        const statusWithNote = statusNote.length > 0 ? `${status} (${statusNote.join(', ')})` : status;
        const statusFinal = isOngoing ? '' : statusWithNote;

        const existingEmployee = await prisma.npattendance.findFirst({
          where: { employee_id: employeeIdStr },
          select: { emp_name: true },
        });
        const employeeName = existingEmployee?.emp_name || 'Unknown';

        // existingRecord already fetched above

        if (!existingRecord) {
          await prisma.npattendance.create({
            data: {
              employee_id: employeeIdStr,
              emp_name: employeeName,
              date: new Date(startDateStr),
              in_time: inTime,
              out_time: outTime,
              clock_times: JSON.stringify(clockTimes),
              total_hours: totalHoursDate as any,
              login_hours: workingHoursDate as any,
              break_hours: breakHoursDate as any,
              shift_time: resolvedShift || undefined,
              status: statusFinal,
            },
          });
          insertedCount++;
        } else {
          await prisma.npattendance.update({
            where: { id: existingRecord.id },
            data: {
              in_time: inTime,
              out_time: outTime,
              clock_times: JSON.stringify(clockTimes),
              total_hours: totalHoursDate as any,
              login_hours: workingHoursDate as any,
              break_hours: breakHoursDate as any,
              shift_time: resolvedShift || existingRecord.shift_time || undefined,
              status: statusFinal,
            },
          });
          updatedCount++;
        }
      }
    }

    logger.info('Attendance data synchronized successfully', { inserted: insertedCount, updated: updatedCount });
    return NextResponse.json({
      success: true,
      message: 'Attendance data synchronized successfully',
      inserted: insertedCount,
      updated: updatedCount,
    });

  } catch (error: any) {
    logger.error('ESSL Sync Error', { error: error.message, stack: error.stack });
    return NextResponse.json(
      {
        error: 'Failed to sync attendance data',
        details: error.message
      },
      { status: 500 }
    );
  }
}

// Helper function to extract strDataList from SOAP response
function extractStrDataList(xmlResponse: string): string | null {
  try {
    // Try multiple patterns to extract strDataList content
    // Pattern 1: Standard tag
    let match = xmlResponse.match(/<strDataList>([\s\S]*?)<\/strDataList>/i);
    if (match && match[1].trim()) return match[1].trim();

    // Pattern 2: With namespace prefix
    match = xmlResponse.match(/<[^:]*:?strDataList[^>]*>([\s\S]*?)<\/[^:]*:?strDataList>/i);
    if (match && match[1].trim()) return match[1].trim();

    // Pattern 3: GetTransactionsLogResult tag (alternative response format)
    match = xmlResponse.match(/<GetTransactionsLogResult[^>]*>([\s\S]*?)<\/GetTransactionsLogResult>/i);
    if (match && match[1].trim()) return match[1].trim();

    // Pattern 4: Check for CDATA section
    match = xmlResponse.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
    if (match && match[1].trim()) return match[1].trim();

    // Pattern 5: Self-closing tag (empty list)
    if (xmlResponse.match(/<strDataList\s*\/>/i) || xmlResponse.match(/<[^:]*:?strDataList\s*\/>/i)) {
      return '';
    }

    // Log the response for debugging if no match found
    logger.debug('SOAP Response extraction failed, dumping preview', { preview: xmlResponse.substring(0, 500) });

    return null;
  } catch (error: any) {
    logger.error('Error extracting strDataList', { error: error.message });
    return null;
  }
}

// Helper function to parse attendance data
function parseAttendanceData(strDataList: string): Record<string, Record<string, number[]>> {
  const lines = strDataList.split('\n');
  const attendanceData: Record<string, Record<string, number[]>> = {};

  for (const line of lines) {
    const trimmedLine = line.trim();
    const match = trimmedLine.match(/(\d+)\s+([\d\- :]+)/);
    if (match) {
      const employeeID = match[1];
      const dateTime = match[2];
      const ts = new Date(dateTime);
      if (Number.isNaN(ts.getTime())) continue;
      const timestamp = Math.floor(ts.getTime() / 1000);

      const d = new Date(timestamp * 1000);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateKey = `${yyyy}-${mm}-${dd}`;

      if (!attendanceData[employeeID]) attendanceData[employeeID] = {};
      if (!attendanceData[employeeID][dateKey]) attendanceData[employeeID][dateKey] = [];
      attendanceData[employeeID][dateKey].push(timestamp);
    }
  }

  return attendanceData;
}

// Helper function to format seconds to HH:mm:ss
function formatSeconds(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Convert duration in seconds to a Date object representing that time of day (UTC)
function secondsToTimeDate(seconds: number): Date {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const ss = String(secs).padStart(2, '0');
  return new Date(`1970-01-01T${hh}:${mm}:${ss}.000Z`);
}

// Format a Date object in local time as "YYYY-MM-DD HH:mm:ss"
function formatLocalDateTime(d: Date): string {
  const yyyy = d.getFullYear();
  const MM = String(d.getMonth() + 1).padStart(2, '0');
  const DD = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${yyyy}-${MM}-${DD} ${hh}:${mm}:${ss}`;
}

// Format current moment as "YYYY-MM-DD HH:mm:ss" in IST (Asia/Kolkata)
// This is critical when sending "toDate=Now" to the ESSL device, which operates in IST.
function formatISTDateTime(d: Date): string {
  // Use toLocaleString with strict options to match desired format
  // en-CA gives YYYY-MM-DD
  // en-GB gives DD/MM/YYYY, usually with HH:mm:ss
  // Best: use Intl.DateTimeFormat or manual offset calc.

  // Manual offset approach (safe & dependency-free): +05:30
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(d.getTime() + istOffset);

  // Now extract UTC components from this shifted date
  const yyyy = istTime.getUTCFullYear();
  const MM = String(istTime.getUTCMonth() + 1).padStart(2, '0');
  const DD = String(istTime.getUTCDate()).padStart(2, '0');
  const hh = String(istTime.getUTCHours()).padStart(2, '0');
  const mm = String(istTime.getUTCMinutes()).padStart(2, '0');
  const ss = String(istTime.getUTCSeconds()).padStart(2, '0');

  return `${yyyy}-${MM}-${DD} ${hh}:${mm}:${ss}`;
}

function parseShiftString(input: string): { startMinutes: number; endMinutes: number } | null {
  if (!input) return null;
  const s = input.trim().toLowerCase();
  let normalized = s
    .replace(/\s+to\s+/g, '-')
    .replace(/\s*–\s*/g, '-')
    .replace(/\s*—\s*/g, '-')
    .replace(/\s+/g, ' ');

  const parts = normalized.split('-').map((p) => p.trim());
  if (parts.length !== 2) return null;

  const parseTime = (t: string): number | null => {
    const ampmMatch = t.match(/^(\d{1,2})(?::(\d{1,2}))?\s*(am|pm)?$/);
    if (!ampmMatch) return null;
    let hh = Number(ampmMatch[1]);
    let mm = Number(ampmMatch[2] ?? '0');
    const ampm = ampmMatch[3];
    if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
    if (ampm) {
      if (ampm === 'pm' && hh !== 12) hh += 12;
      if (ampm === 'am' && hh === 12) hh = 0;
    }
    if (!ampm && hh >= 0 && hh <= 24) {
      if (hh === 24) hh = 0;
    }
    return hh * 60 + mm;
  };

  const start = parseTime(parts[0].replace(/\./g, ''));
  const end = parseTime(parts[1].replace(/\./g, ''));
  if (start == null || end == null) return null;
  return { startMinutes: start, endMinutes: end };
}



// GET endpoint to trigger sync (for testing)
export async function GET(request: NextRequest) {
  return POST(request);
}

// ---------------- JSON attendance (fetchAttendanceData) helpers ----------------
function parseHmsToSeconds(hms?: string): number {
  if (!hms) return 0;
  const parts = hms.split(':');
  if (parts.length !== 3) return 0;
  const [h, m, s] = parts.map((p) => Number(p) || 0);
  return h * 3600 + m * 60 + s;
}

function ensureDateTime(dateStr: string, timeStr?: string | null, fallbackTimes?: string[]): Date | null {
  let hhmm: string | undefined = timeStr || undefined;
  if (!hhmm && fallbackTimes && fallbackTimes.length > 0) {
    hhmm = fallbackTimes[0];
  }
  if (!hhmm) return null;
  const [hh, mm] = hhmm.split(':').map((v) => Number(v));
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  const d = new Date(`${dateStr}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function handleJsonAttendance(url: string, overwriteShift?: boolean) {
  try {
    const httpRes = await axios.get(url);
    if (!httpRes || httpRes.status < 200 || httpRes.status >= 300) {
      return NextResponse.json({ error: 'Failed to fetch logs from the source.' }, { status: 500 });
    }

    const responseData = httpRes.data;
    if (!responseData || typeof responseData !== 'object' || !Array.isArray(responseData.records)) {
      return NextResponse.json({ error: 'Invalid data format received from biometric source.' }, { status: 500 });
    }

    const logs: any[] = responseData.records;
    let inserted = 0;
    let updated = 0;
    let skippedNon2025 = 0;
    const minAllowedDate = new Date('2025-01-01T00:00:00');

    for (const log of logs) {
      try {
        const employeeID: string = String(log['employee_id'] ?? '').trim();
        const logDate: string = (log['date'] ?? '').toString().substring(0, 10); // YYYY-MM-DD
        if (!employeeID || !logDate) continue;
        const employeeIdNum = Number(employeeID);
        if (Number.isNaN(employeeIdNum)) continue;

        const cycleDate = logDate; // In this mode, use plain date (no 7AM cycle)
        const cycleDateObj = new Date(`${cycleDate}T00:00:00`);
        if (cycleDateObj < minAllowedDate) { skippedNon2025++; continue; }

        // Existing employee name from prior entries if available
        const employeeIdStr = String(employeeID);
        const existingEmployee = await prisma.npattendance.findFirst({
          where: { employee_id: employeeIdNum as any },
          select: { emp_name: true },
        });
        const employeeName: string = existingEmployee?.emp_name || log['employee_name'] || 'Unknown';

        // Times/metrics
        const loginHoursStr: string | undefined = log['working_hours'] || undefined;
        const workingSeconds = parseHmsToSeconds(loginHoursStr);
        const totalHoursRaw: string | undefined = log['total_hours'] || undefined;
        const breakHoursRaw: string | undefined = log['break_hours'] || undefined;
        const totalHoursDateJson = secondsToTimeDate(parseHmsToSeconds(totalHoursRaw || '00:00:00'));
        const loginHoursDateJson = secondsToTimeDate(workingSeconds);
        const breakHoursDateJson = secondsToTimeDate(parseHmsToSeconds(breakHoursRaw || '00:00:00'));

        // Clock times array (HH:mm)
        let clockTimes: string[] = Array.isArray(log['clock_times']) ? (log['clock_times'] as string[]) : [];
        // Deduplicate and sort ascending
        clockTimes = Array.from(new Set(clockTimes)).sort();

        // Build in/out Date
        const inTime = ensureDateTime(cycleDate, log['in_time'], clockTimes);
        const outTime = ensureDateTime(cycleDate, log['out_time'], clockTimes.slice().reverse());
        if (!inTime || !outTime) {
          // If still cannot build times, skip this record (schema requires non-null)
          continue;
        }

        // Resolve shift: prefer stored npattendance.shiftTime for that date, fallback to shift_time table
        const existingRecord = await prisma.npattendance.findFirst({
          where: { employee_id: employeeIdStr, date: new Date(cycleDate) },
        });
        let resolvedShift: string | null = overwriteShift ? null : (existingRecord?.shift_time ?? null);
        if (!resolvedShift) {
          const shiftRow = await prisma.shift_time.findFirst({
            where: { biomatric_id: employeeIdNum },
            select: { shift_time: true },
          });
          resolvedShift = shiftRow?.shift_time ?? null;
        }

        // Status logic (no holiday/leave DB available here)
        let status = '';
        if (workingSeconds >= 8 * 3600) status = 'Present';
        else if (workingSeconds >= 5 * 3600) status = 'Half-day';
        else if (workingSeconds < 4 * 3600 && cycleDate !== new Date().toISOString().split('T')[0]) status = 'Absent';

        // Early/Late notes from resolvedShift (15 min threshold); JSON mode keeps its 5h half-day rule
        let statusNoteJson: string[] = [];
        if (resolvedShift) {
          const shiftParsed = parseShiftString(resolvedShift);
          if (shiftParsed) {
            const { startMinutes, endMinutes } = shiftParsed;
            const startDate = new Date(inTime);
            startDate.setHours(0, 0, 0, 0);
            startDate.setMinutes(startMinutes);
            const endDate = new Date(inTime);
            endDate.setHours(0, 0, 0, 0);
            endDate.setMinutes(endMinutes);
            if (endDate <= startDate) endDate.setDate(endDate.getDate() + 1);

            const lateThreshold = new Date(startDate.getTime() + 15 * 60 * 1000);
            const earlyThreshold = new Date(endDate.getTime() - 15 * 60 * 1000);
            const isLate = inTime > lateThreshold;
            const isEarly = outTime < earlyThreshold;
            if (isLate) statusNoteJson.push('Late');
            if (isEarly) {
              if (workingSeconds >= 8 * 3600) status = 'Present';
              else if (workingSeconds >= 5 * 3600) status = 'Half-day';
              else status = 'Absent';
              statusNoteJson.push('Early');
            }
          }
        }

        // For today's record, suppress status
        const todayLocalJson = new Date();
        const todayStrJson = `${todayLocalJson.getFullYear()}-${String(todayLocalJson.getMonth() + 1).padStart(2, '0')}-${String(todayLocalJson.getDate()).padStart(2, '0')}`;
        const statusFinalJson = cycleDate === todayStrJson ? '' : (statusNoteJson.length ? `${status} (${statusNoteJson.join(', ')})` : status);

        if (existingRecord) {
          // Merge clock times
          const existingClockTimes = (() => {
            try { return JSON.parse(existingRecord.clock_times || '[]'); } catch { return []; }
          })();
          const mergedClockTimes = Array.from(new Set([...(existingClockTimes || []), ...clockTimes])).sort();

          await prisma.npattendance.update({
            where: { id: existingRecord.id },
            data: {
              out_time: outTime,
              login_hours: loginHoursDateJson as any,
              total_hours: totalHoursDateJson as any,
              break_hours: breakHoursDateJson as any,
              clock_times: JSON.stringify(mergedClockTimes),
              shift_time: resolvedShift || existingRecord.shift_time || undefined,
              status: statusFinalJson,
            },
          });
          updated++;
        } else {
          await prisma.npattendance.create({
            data: {
              employee_id: employeeIdStr,
              emp_name: employeeName,
              date: new Date(cycleDate),
              in_time: inTime,
              out_time: outTime,
              login_hours: loginHoursDateJson as any,
              total_hours: totalHoursDateJson as any,
              break_hours: breakHoursDateJson as any,
              clock_times: JSON.stringify(clockTimes),
              shift_time: resolvedShift || undefined,
              status: statusFinalJson,
            },
          });
          inserted++;
        }
      } catch {
        // Skip bad log entries silently (can add logging if needed)
        continue;
      }
    }

    return NextResponse.json({
      success: true,
      mode: 'json',
      message: 'Attendance data processed from JSON',
      inserted,
      updated,
      skippedNon2025,
    });
  } catch (e: any) {
    return NextResponse.json({ error: 'Error fetching attendance data', details: e.message }, { status: 500 });
  }
}