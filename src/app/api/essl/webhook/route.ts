import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Webhook endpoint for receiving real-time attendance data from ESSL device
 * 
 * Expected payload format:
 * {
 *   "employee_id": "123",
 *   "timestamp": "2025-11-25 14:30:45",
 *   "device_serial": "ESSL123456" (optional)
 * }
 * 
 * Or array format:
 * [
 *   { "employee_id": "123", "timestamp": "2025-11-25 14:30:45" },
 *   { "employee_id": "456", "timestamp": "2025-11-25 14:31:00" }
 * ]
 */

interface WebhookPayload {
    employee_id: string;
    timestamp: string;
    device_serial?: string;
}

export async function POST(request: NextRequest) {
    try {
        // Verify webhook secret if configured
        const webhookSecret = process.env.ESSL_WEBHOOK_SECRET;
        if (webhookSecret) {
            const authHeader = request.headers.get('authorization');
            const providedSecret = authHeader?.replace('Bearer ', '');

            if (providedSecret !== webhookSecret) {
                return NextResponse.json(
                    { error: 'Unauthorized: Invalid webhook secret' },
                    { status: 401 }
                );
            }
        }

        const body = await request.json();
        const payloads: WebhookPayload[] = Array.isArray(body) ? body : [body];

        if (payloads.length === 0) {
            return NextResponse.json(
                { error: 'No data provided' },
                { status: 400 }
            );
        }

        const results = {
            processed: 0,
            inserted: 0,
            updated: 0,
            errors: [] as string[]
        };

        const MAX_SHIFT_HOURS = Number(process.env.ESSL_MAX_SHIFT_HOURS || 16);
        const MAX_SHIFT_SECONDS = MAX_SHIFT_HOURS * 3600;

        for (const payload of payloads) {
            try {
                const { employee_id, timestamp } = payload;

                if (!employee_id || !timestamp) {
                    results.errors.push(`Missing employee_id or timestamp in payload`);
                    continue;
                }

                const employeeIdStr = String(employee_id).trim();
                const employeeIdNum = Number(employee_id);

                if (Number.isNaN(employeeIdNum)) {
                    results.errors.push(`Invalid employee_id: ${employee_id}`);
                    continue;
                }

                // Parse timestamp
                const punchTime = new Date(timestamp);
                if (Number.isNaN(punchTime.getTime())) {
                    results.errors.push(`Invalid timestamp format: ${timestamp}`);
                    continue;
                }

                const punchTimestamp = Math.floor(punchTime.getTime() / 1000);

                // Determine the cycle date (date of the attendance record)
                const cycleDate = (() => {
                    const d = new Date(punchTime);
                    const yyyy = d.getFullYear();
                    const mm = String(d.getMonth() + 1).padStart(2, '0');
                    const dd = String(d.getDate()).padStart(2, '0');
                    return `${yyyy}-${mm}-${dd}`;
                })();

                // Get employee name from existing records
                const existingEmployee = await prisma.npattendance.findFirst({
                    where: { employee_id: employeeIdStr },
                    select: { emp_name: true },
                });
                const employeeName = existingEmployee?.emp_name || 'Unknown';

                // Get or create today's attendance record
                let attendanceRecord = await prisma.npattendance.findFirst({
                    where: {
                        employee_id: employeeIdStr,
                        date: new Date(cycleDate)
                    }
                });

                // Parse existing clock times
                let clockTimes: number[] = [];
                if (attendanceRecord?.clock_times) {
                    try {
                        const parsed = JSON.parse(attendanceRecord.clock_times);
                        clockTimes = Array.isArray(parsed)
                            ? parsed.map((t: any) => {
                                if (typeof t === 'string') {
                                    const [hh, mm] = t.split(':').map(Number);
                                    const date = new Date(cycleDate);
                                    date.setHours(hh, mm, 0, 0);
                                    return Math.floor(date.getTime() / 1000);
                                }
                                return Number(t);
                            }).filter((t: number) => !Number.isNaN(t))
                            : [];
                    } catch {
                        clockTimes = [];
                    }
                }

                // Add new timestamp if not already present
                if (!clockTimes.includes(punchTimestamp)) {
                    clockTimes.push(punchTimestamp);
                    clockTimes.sort((a, b) => a - b);
                }

                // Calculate attendance metrics
                const inTs = clockTimes[0];
                const outTs = clockTimes[clockTimes.length - 1];
                const inTime = new Date(inTs * 1000);
                const outTime = new Date(outTs * 1000);

                // Convert timestamps to HH:mm format for storage
                const clockTimesFormatted = clockTimes.map(ts => {
                    const date = new Date(ts * 1000);
                    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
                });

                // Calculate working hours (pair-wise: in-out-in-out)
                let workingSeconds = 0;
                for (let i = 0; i < clockTimes.length - 1; i += 2) {
                    if (clockTimes[i + 1]) {
                        workingSeconds += clockTimes[i + 1] - clockTimes[i];
                    }
                }

                const totalSeconds = outTs - inTs;
                const breakSeconds = Math.max(0, totalSeconds - workingSeconds);

                const totalHoursDate = secondsToTimeDate(totalSeconds);
                const workingHoursDate = secondsToTimeDate(workingSeconds);
                const breakHoursDate = secondsToTimeDate(breakSeconds);

                // Get shift information
                const shift = await prisma.shift_time.findFirst({
                    where: { biomatric_id: employeeIdNum },
                    select: { shift_time: true },
                });
                const resolvedShift = attendanceRecord?.shift_time || shift?.shift_time || null;

                // Calculate status
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

                // Check if shift is still ongoing
                const nowSec = Math.floor(Date.now() / 1000);
                const windowEnd = inTs + MAX_SHIFT_SECONDS;
                const isOngoing = nowSec >= inTs && nowSec <= windowEnd;
                const statusWithNote = statusNote.length > 0 ? `${status} (${statusNote.join(', ')})` : status;
                const statusFinal = isOngoing ? '' : statusWithNote;

                // Create or update attendance record
                if (!attendanceRecord) {
                    await prisma.npattendance.create({
                        data: {
                            employee_id: employeeIdStr,
                            emp_name: employeeName,
                            date: new Date(cycleDate),
                            in_time: inTime,
                            out_time: outTime,
                            clock_times: JSON.stringify(clockTimesFormatted),
                            total_hours: totalHoursDate as any,
                            login_hours: workingHoursDate as any,
                            break_hours: breakHoursDate as any,
                            shift_time: resolvedShift || undefined,
                            status: statusFinal,
                        },
                    });
                    results.inserted++;
                } else {
                    await prisma.npattendance.update({
                        where: { id: attendanceRecord.id },
                        data: {
                            out_time: outTime,
                            clock_times: JSON.stringify(clockTimesFormatted),
                            total_hours: totalHoursDate as any,
                            login_hours: workingHoursDate as any,
                            break_hours: breakHoursDate as any,
                            status: statusFinal,
                        },
                    });
                    results.updated++;
                }

                results.processed++;

            } catch (error: any) {
                results.errors.push(`Error processing employee ${payload.employee_id}: ${error.message}`);
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Webhook processed successfully',
            ...results
        });

    } catch (error: any) {
        console.error('Webhook Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to process webhook',
                details: error.message
            },
            { status: 500 }
        );
    }
}

// Helper function to convert seconds to Date object (for time storage)
function secondsToTimeDate(seconds: number): Date {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');
    const ss = String(secs).padStart(2, '0');
    return new Date(`1970-01-01T${hh}:${mm}:${ss}.000Z`);
}

// Helper function to parse shift time string
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

// GET endpoint for testing
export async function GET(request: NextRequest) {
    return NextResponse.json({
        message: 'ESSL Webhook Endpoint',
        usage: 'POST to this endpoint with attendance data',
        format: {
            single: {
                employee_id: '123',
                timestamp: '2025-11-25 14:30:45'
            },
            multiple: [
                { employee_id: '123', timestamp: '2025-11-25 14:30:45' },
                { employee_id: '456', timestamp: '2025-11-25 14:31:00' }
            ]
        },
        headers: {
            authorization: 'Bearer YOUR_WEBHOOK_SECRET (if ESSL_WEBHOOK_SECRET is set)'
        }
    });
}
