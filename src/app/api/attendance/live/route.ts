import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * API endpoint to get live attendance data with real-time calculations
 * Returns current working hours for ongoing shifts
 */

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const employeeId = searchParams.get('employee_id');
        const date = searchParams.get('date');

        if (!employeeId) {
            return NextResponse.json(
                { error: 'employee_id is required' },
                { status: 400 }
            );
        }

        // Use today's date if not provided
        const targetDate = date || new Date().toISOString().split('T')[0];

        // Trigger a quick ESSL sync in the background (fire-and-forget)
        // This ensures we get the latest punch data from the device
        const syncUrl = process.env.ESSL_SYNC_URL;
        if (syncUrl) {
            try {
                const controller = new AbortController();
                const timeout = Number(process.env.ESSL_SYNC_TIMEOUT_MS || 5000);
                const timeoutId = setTimeout(() => controller.abort(), timeout);
                
                // Sync only today's data for faster response
                const now = new Date();
                const todayStart = new Date(now);
                todayStart.setHours(0, 0, 0, 0);
                
                // Fire-and-forget sync request
                fetch(syncUrl, { 
                    method: 'POST',
                    signal: controller.signal,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        fromDate: `${targetDate} 00:00:00`,
                        toDate: 'now',
                        lookbackDays: 0 // Only sync today
                    })
                }).then(() => clearTimeout(timeoutId)).catch(() => clearTimeout(timeoutId));
            } catch {
                // Ignore sync errors, continue with existing data
            }
        }

        // Small delay to allow sync to complete (if it's fast)
        await new Promise(resolve => setTimeout(resolve, 150));

        // Get attendance record
        const attendance = await prisma.npattendance.findFirst({
            where: {
                employee_id: employeeId,
                date: new Date(targetDate)
            }
        });

        if (!attendance) {
            return NextResponse.json({
                hasRecord: false,
                isOngoing: false
            });
        }

        // Parse clock times
        let clockTimes: string[] = [];
        try {
            clockTimes = JSON.parse(attendance.clock_times || '[]');
        } catch {
            clockTimes = [];
        }

        if (clockTimes.length === 0) {
            return NextResponse.json({
                hasRecord: true,
                isOngoing: false,
                attendance
            });
        }

        // Convert clock times to timestamps
        const timestamps = clockTimes.map(time => {
            const [hh, mm] = time.split(':').map(Number);
            const date = new Date(targetDate);
            date.setHours(hh, mm, 0, 0);
            return date.getTime();
        }).sort((a, b) => a - b);

        const firstPunch = timestamps[0];
        const lastPunch = timestamps[timestamps.length - 1];
        const now = Date.now();

        // Check if shift is ongoing (odd number of punches or last punch was recent)
        const MAX_SHIFT_HOURS = Number(process.env.ESSL_MAX_SHIFT_HOURS || 16);
        const MAX_SHIFT_MS = MAX_SHIFT_HOURS * 60 * 60 * 1000;
        const isOngoing = (timestamps.length % 2 !== 0) || (now - lastPunch < MAX_SHIFT_MS && now - firstPunch < MAX_SHIFT_MS);

        // Calculate real-time values
        const currentOutTime = isOngoing ? now : lastPunch;

        // Calculate working time (pair-wise: in-out-in-out)
        let workingMs = 0;
        for (let i = 0; i < timestamps.length - 1; i += 2) {
            if (timestamps[i + 1]) {
                workingMs += timestamps[i + 1] - timestamps[i];
            }
        }

        // If ongoing and odd number of punches, add current working period
        if (isOngoing && timestamps.length % 2 !== 0) {
            workingMs += now - timestamps[timestamps.length - 1];
        }

        const totalMs = currentOutTime - firstPunch;
        const breakMs = Math.max(0, totalMs - workingMs);

        // Format durations
        const formatDuration = (ms: number) => {
            const totalSeconds = Math.floor(ms / 1000);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        };

        return NextResponse.json({
            hasRecord: true,
            isOngoing,
            employeeId: attendance.employee_id,
            employeeName: attendance.emp_name,
            date: targetDate,
            inTime: new Date(firstPunch).toISOString(),
            outTime: new Date(currentOutTime).toISOString(),
            clockTimes,
            totalHours: formatDuration(totalMs),
            loginHours: formatDuration(workingMs),
            breakHours: formatDuration(breakMs),
            status: attendance.status,
            shiftTime: attendance.shift_time,
            lastUpdated: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('Live Attendance Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch live attendance data',
                details: error.message
            },
            { status: 500 }
        );
    }
}
