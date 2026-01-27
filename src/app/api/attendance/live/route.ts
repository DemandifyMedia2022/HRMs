import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { triggerEsslSync, waitForSync } from '@/lib/essl-sync';

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

        // Use today's date if not provided (in IST)
        const getISTDate = () => {
            return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
        };
        const targetDate = date || getISTDate();

        // Trigger ESSL sync with rate limiting for specific employee
        const syncInitiated = await triggerEsslSync({ 
            date: targetDate, 
            employeeCode: employeeId 
        });
        await waitForSync(syncInitiated);

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

        // Convert clock times to timestamps (explicitly treating them as IST)
        const timestamps = clockTimes.map(time => {
            const [hh, mm] = time.split(':').map(str => str.padStart(2, '0'));
            // Construct ISO string with IST offset (+05:30)
            const isoString = `${targetDate}T${hh}:${mm}:00+05:30`;
            return new Date(isoString).getTime();
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
            const totalSeconds = Math.max(0, Math.floor(ms / 1000));
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        };

        // Calculate live status
        let liveStatus = attendance.status || '';
        const workingSeconds = workingMs / 1000;
        if (!liveStatus || liveStatus === 'Absent') {
            if (workingSeconds >= 8 * 3600) {
                liveStatus = 'Present';
            } else if (workingSeconds >= 4 * 3600) {
                liveStatus = 'Half-day';
            }
        }

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
            status: liveStatus,
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
