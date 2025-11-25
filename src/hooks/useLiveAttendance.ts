'use client';

import { useEffect, useState, useRef } from 'react';

interface LiveAttendanceData {
    hasRecord: boolean;
    isOngoing: boolean;
    employeeId?: string;
    employeeName?: string;
    date?: string;
    inTime?: string;
    outTime?: string;
    clockTimes?: string[];
    totalHours?: string;
    loginHours?: string;
    breakHours?: string;
    status?: string;
    shiftTime?: string | null;
    lastUpdated?: string;
}

interface UseLiveAttendanceOptions {
    employeeId: string;
    date?: string;
    enabled?: boolean;
    pollInterval?: number; // milliseconds, default 30000 (30 seconds)
}

export function useLiveAttendance({
    employeeId,
    date,
    enabled = true,
    pollInterval = 30000 // Reduced from 1000ms to 30000ms (30 seconds)
}: UseLiveAttendanceOptions) {
    const [data, setData] = useState<LiveAttendanceData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [clientTime, setClientTime] = useState<Date>(new Date());

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const clientTimerRef = useRef<NodeJS.Timeout | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const fetchLiveData = async () => {
        try {
            // Cancel previous request if still pending
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            abortControllerRef.current = new AbortController();

            const params = new URLSearchParams({ employee_id: employeeId });
            if (date) params.append('date', date);

            const response = await fetch(`/api/attendance/live?${params.toString()}`, {
                signal: abortControllerRef.current.signal
            });

            if (!response.ok) {
                throw new Error('Failed to fetch live attendance data');
            }

            const result = await response.json();
            setData(result);
            setError(null);
            setIsLoading(false);

            // If shift is not ongoing, we can stop polling
            if (!result.isOngoing && intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        } catch (err: any) {
            if (err.name === 'AbortError') {
                // Request was cancelled, ignore
                return;
            }
            setError(err.message);
            setIsLoading(false);
        }
    };

    // Client-side timer that updates every second for display purposes only
    useEffect(() => {
        if (!data?.isOngoing) return;

        clientTimerRef.current = setInterval(() => {
            setClientTime(new Date());
        }, 1000);

        return () => {
            if (clientTimerRef.current) {
                clearInterval(clientTimerRef.current);
            }
        };
    }, [data?.isOngoing]);

    // Server polling - only every 30 seconds
    useEffect(() => {
        if (!enabled || !employeeId) {
            return;
        }

        // Initial fetch
        fetchLiveData();

        // Set up polling (every 30 seconds instead of 1 second)
        intervalRef.current = setInterval(fetchLiveData, pollInterval);

        // Cleanup
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            if (clientTimerRef.current) {
                clearInterval(clientTimerRef.current);
            }
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [employeeId, date, enabled, pollInterval]);

    // Calculate live times on client side
    const getLiveData = (): LiveAttendanceData | null => {
        if (!data) return null;
        if (!data.isOngoing) return data;

        // Calculate elapsed time since last server update
        const inTime = data.inTime ? new Date(data.inTime).getTime() : 0;
        if (!inTime) return data;

        const now = clientTime.getTime();

        // Parse clock times to timestamps
        const clockTimes = (data.clockTimes || []).map(time => {
            const [hh, mm] = time.split(':').map(Number);
            const d = new Date(data.date || new Date());
            d.setHours(hh, mm, 0, 0);
            return d.getTime();
        }).sort((a, b) => a - b);

        // Calculate working time (pair-wise: in-out-in-out)
        let workingMs = 0;
        for (let i = 0; i < clockTimes.length - 1; i += 2) {
            if (clockTimes[i + 1]) {
                workingMs += clockTimes[i + 1] - clockTimes[i];
            }
        }

        // If ongoing and odd number of punches, add current working period
        if (clockTimes.length % 2 !== 0) {
            workingMs += now - clockTimes[clockTimes.length - 1];
        }

        const totalMs = now - inTime;
        const breakMs = Math.max(0, totalMs - workingMs);

        // Format durations
        const formatDuration = (ms: number) => {
            const totalSeconds = Math.floor(ms / 1000);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        };

        return {
            ...data,
            totalHours: formatDuration(totalMs),
            loginHours: formatDuration(workingMs),
            breakHours: formatDuration(breakMs),
            outTime: new Date(now).toISOString()
        };
    };

    return {
        data: getLiveData(),
        error,
        isLoading,
        refetch: fetchLiveData
    };
}
