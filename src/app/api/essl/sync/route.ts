import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import axios from 'axios';

interface AttendanceRecord {
  employeeID: string;
  cycleDate: string;
  timestamps: number[];
}

export async function POST(request: NextRequest) {
  try {
    // Get body
    const body = await request.json().catch(() => ({}));

    // If a JSON URL is provided, run JSON mode (Laravel fetchAttendanceData equivalent)
    const jsonUrl: string | null = body.url || request.nextUrl.searchParams.get('url');
    if (jsonUrl) {
      return await handleJsonAttendance(jsonUrl);
    }

    // SOAP mode: Get date range from request or use defaults
    const fromDate = body.fromDate || '2025-01-01 07:00:00';
    const toDate = body.toDate || new Date().toISOString().replace('T', ' ').substring(0, 19);

    // ESSL Configuration from environment variables
    const serverUrl = process.env.ESSL_SERVER_URL!;
    const serialNumber = process.env.ESSL_SERIAL_NUMBER!;
    const username = process.env.ESSL_USERNAME!;
    const password = process.env.ESSL_PASSWORD!;

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
        SOAPAction: '"http://tempuri.org/GetTransactionsLog"'
      }
    });

    // Check if response is XML
    if (!response.data.includes('<?xml')) {
      return NextResponse.json({ error: 'Non-XML response received', response: response.data }, { status: 500 });
    }

    // Parse XML response
    const strDataList = extractStrDataList(response.data);
    if (!strDataList) {
      return NextResponse.json({ error: 'Failed to extract data from SOAP response' }, { status: 500 });
    }

    // Process attendance data
    const attendanceData = parseAttendanceData(strDataList);

    // Store in database
    let insertedCount = 0;
    let updatedCount = 0;

    const minAllowedDate = new Date('2025-01-01T00:00:00');
    for (const [employeeID, dates] of Object.entries(attendanceData)) {
      for (const [cycleDate, timestamps] of Object.entries(dates)) {
        // Enforce only 2025 data
        const cycleDateObj = new Date(`${cycleDate}T00:00:00`);
        if (cycleDateObj < minAllowedDate) {
          continue;
        }
        const sortedTimestamps = timestamps.sort((a, b) => a - b);
        const employeeIdNum = Number(employeeID);
        if (Number.isNaN(employeeIdNum)) {
          continue;
        }

        // Extract first and last clock-in/out times
        const inTime = new Date(sortedTimestamps[0] * 1000);
        const outTime = new Date(sortedTimestamps[sortedTimestamps.length - 1] * 1000);

        // Get all clock times in HH:mm format
        const clockTimes = sortedTimestamps.map(ts => {
          const date = new Date(ts * 1000);
          return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        });

        // Calculate working hours
        const totalSeconds = sortedTimestamps[sortedTimestamps.length - 1] - sortedTimestamps[0];
        let workingSeconds = 0;

        for (let i = 0; i < sortedTimestamps.length - 1; i += 2) {
          if (sortedTimestamps[i + 1]) {
            workingSeconds += sortedTimestamps[i + 1] - sortedTimestamps[i];
          }
        }

        const breakSeconds = totalSeconds - workingSeconds;

        const totalHours = formatSeconds(totalSeconds);
        const workingHours = formatSeconds(workingSeconds);
        const breakHours = formatSeconds(breakSeconds);
        const totalHoursTime = secondsToTimeDate(totalSeconds);
        const workingHoursTime = secondsToTimeDate(workingSeconds);
        const breakHoursTime = secondsToTimeDate(breakSeconds);

        const status = workingSeconds >= 8 * 3600 ? 'Present' : workingSeconds >= 4 * 3600 ? 'Half-day' : 'Absent';

        // Fetch employee name if exists
        const existingEmployee = await prisma.npAttendance.findFirst({
          where: { employeeId: employeeIdNum },
          select: { empName: true }
        });

        const employeeName = existingEmployee?.empName || 'Unknown';

        // Check if record exists
        const existingRecord = await prisma.npAttendance.findFirst({
          where: {
            employeeId: employeeIdNum,
            date: new Date(cycleDate)
          }
        });

        if (!existingRecord) {
          // Insert new record
          await prisma.npAttendance.create({
            data: {
              employeeId: employeeIdNum,
              empName: employeeName,
              date: new Date(cycleDate),
              inTime,
              outTime,
              clockTimes: JSON.stringify(clockTimes),
              totalHours: totalHoursTime,
              loginHours: workingHoursTime,
              breakHours: breakHoursTime,
              status
            }
          });
          insertedCount++;
        } else {
          // Update existing record
          await prisma.npAttendance.update({
            where: { id: existingRecord.id },
            data: {
              inTime,
              outTime,
              clockTimes: JSON.stringify(clockTimes),
              totalHours: totalHoursTime,
              loginHours: workingHoursTime,
              breakHours: breakHoursTime,
              status
            }
          });
          updatedCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Attendance data synchronized successfully',
      inserted: insertedCount,
      updated: updatedCount
    });
  } catch (error: any) {
    console.error('ESSL Sync Error:', error);
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
    // Simple regex to extract strDataList content
    const match = xmlResponse.match(/<strDataList>([\s\S]*?)<\/strDataList>/);
    return match ? match[1].trim() : null;
  } catch (error) {
    return null;
  }
}

// Helper function to parse attendance data
function parseAttendanceData(strDataList: string): Record<string, Record<string, number[]>> {
  const lines = strDataList.split('\n');
  const attendanceData: Record<string, Record<string, number[]>> = {};

  for (const line of lines) {
    const trimmedLine = line.trim();
    // Match pattern: employeeID followed by date-time
    const match = trimmedLine.match(/(\d+)\s+([\d\- :]+)/);

    if (match) {
      const employeeID = match[1];
      const dateTime = match[2];
      const timestamp = Math.floor(new Date(dateTime).getTime() / 1000);

      // Calculate cycle date (7 AM to 7 AM next day)
      const date = new Date(timestamp * 1000);
      let cycleStart = new Date(date);
      cycleStart.setHours(7, 0, 0, 0);

      if (date < cycleStart) {
        cycleStart.setDate(cycleStart.getDate() - 1);
      }

      const cycleDate = cycleStart.toISOString().split('T')[0];

      // Initialize nested objects if they don't exist
      if (!attendanceData[employeeID]) {
        attendanceData[employeeID] = {};
      }
      if (!attendanceData[employeeID][cycleDate]) {
        attendanceData[employeeID][cycleDate] = [];
      }

      attendanceData[employeeID][cycleDate].push(timestamp);
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

// GET endpoint to trigger sync (for testing)
export async function GET(request: NextRequest) {
  return POST(request);
}

// ---------------- JSON attendance (fetchAttendanceData) helpers ----------------
function parseHmsToSeconds(hms?: string): number {
  if (!hms) return 0;
  const parts = hms.split(':');
  if (parts.length !== 3) return 0;
  const [h, m, s] = parts.map(p => Number(p) || 0);
  return h * 3600 + m * 60 + s;
}

function ensureDateTime(dateStr: string, timeStr?: string | null, fallbackTimes?: string[]): Date | null {
  // Build Date from date string (YYYY-MM-DD) and HH:mm time. If missing, use min/max from fallbackTimes
  let hhmm: string | undefined = timeStr || undefined;
  if (!hhmm && fallbackTimes && fallbackTimes.length > 0) {
    // If we're computing inTime, use first; for outTime, caller will pass reversed array
    hhmm = fallbackTimes[0];
  }
  if (!hhmm) return null;
  const [hh, mm] = hhmm.split(':').map(v => Number(v));
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  const d = new Date(`${dateStr}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function handleJsonAttendance(url: string) {
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
        if (cycleDateObj < minAllowedDate) {
          skippedNon2025++;
          continue;
        }

        // Existing employee name from prior entries if available
        const existingEmployee = await prisma.npAttendance.findFirst({
          where: { employeeId: employeeIdNum },
          select: { empName: true }
        });
        const employeeName: string = existingEmployee?.empName || log['employee_name'] || 'Unknown';

        // Times/metrics
        const loginHoursStr: string | undefined = log['working_hours'] || undefined;
        const workingSeconds = parseHmsToSeconds(loginHoursStr);
        const totalHours: string | undefined = log['total_hours'] || undefined;
        const breakHours: string | undefined = log['break_hours'] || undefined;
        const loginHoursTime = secondsToTimeDate(workingSeconds);
        const totalHoursTime = secondsToTimeDate(parseHmsToSeconds(totalHours || '00:00:00'));
        const breakHoursTime = secondsToTimeDate(parseHmsToSeconds(breakHours || '00:00:00'));

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

        // Status logic (no holiday/leave DB available here)
        let status = '';
        if (workingSeconds >= 8 * 3600) status = 'Present';
        else if (workingSeconds >= 5 * 3600) status = 'Half-day';
        else if (workingSeconds < 4 * 3600 && cycleDate !== new Date().toISOString().split('T')[0]) status = 'Absent';

        // Check if record exists
        const existingRecord = await prisma.npAttendance.findFirst({
          where: { employeeId: employeeIdNum, date: new Date(cycleDate) }
        });

        if (existingRecord) {
          // Merge clock times
          const existingClockTimes = (() => {
            try {
              return JSON.parse(existingRecord.clockTimes || '[]');
            } catch {
              return [];
            }
          })();
          const mergedClockTimes = Array.from(new Set([...(existingClockTimes || []), ...clockTimes])).sort();

          await prisma.npAttendance.update({
            where: { id: existingRecord.id },
            data: {
              outTime,
              loginHours: loginHoursTime ?? existingRecord.loginHours,
              totalHours: totalHoursTime ?? existingRecord.totalHours,
              breakHours: breakHoursTime ?? existingRecord.breakHours,
              clockTimes: JSON.stringify(mergedClockTimes),
              status
            }
          });
          updated++;
        } else {
          await prisma.npAttendance.create({
            data: {
              employeeId: employeeIdNum,
              empName: employeeName,
              date: new Date(cycleDate),
              inTime,
              outTime,
              loginHours: loginHoursTime,
              totalHours: totalHoursTime,
              breakHours: breakHoursTime,
              clockTimes: JSON.stringify(clockTimes),
              status
            }
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
      skippedNon2025
    });
  } catch (e: any) {
    return NextResponse.json({ error: 'Error fetching attendance data', details: e.message }, { status: 500 });
  }
}
