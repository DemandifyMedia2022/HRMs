'use client';

import { useLiveAttendance } from '@/hooks/useLiveAttendance';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { IconClock, IconLogin, IconLogout, IconPlayerPause, IconCircleDotted } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';

interface LiveAttendanceCardProps {
    employeeId: string;
    date?: string;
    showClockTimes?: boolean;
}

export function LiveAttendanceCard({
    employeeId,
    date,
    showClockTimes = true
}: LiveAttendanceCardProps) {
    const { data, error, isLoading } = useLiveAttendance({
        employeeId,
        date,
        enabled: true,
        pollInterval: 10000 // Update from server every 10 seconds (client updates every second)
    });

    const breakNotificationSent = useRef(false);

    // Monitor break time and send notification if > 45 minutes
    useEffect(() => {
        if (!data?.isOngoing || !data.breakHours) return;

        const [hours, minutes] = data.breakHours.split(':').map(Number);
        const totalBreakMinutes = hours * 60 + minutes;

        // Check localStorage to see if we already sent an alert today
        const todayStr = new Date().toDateString();
        const alertKey = `break_alert_sent_${employeeId}_${todayStr}`;
        const alreadySentToday = typeof window !== 'undefined' ? localStorage.getItem(alertKey) === 'true' : false;

        if (totalBreakMinutes > 45 && !alreadySentToday && !breakNotificationSent.current) {
            // Send notification
            fetch('/api/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employee_id: employeeId,
                    type: 'break_alert',
                    title: 'Break Time Alert',
                    message: `Your break time has exceeded 45 minutes (${data.breakHours}). Please resume work.`,
                    link: '/pages/user'
                })
            })
                .then(res => {
                    if (res.ok) {
                        breakNotificationSent.current = true;
                        if (typeof window !== 'undefined') {
                            localStorage.setItem(alertKey, 'true');
                        }
                    }
                })
                .catch(err => console.error('Failed to send notification:', err));
        }

        // Reset flag/storage if break is back under 45 minutes (e.g. if logic changes or specific use case)
        // For now, we only clear the ref, not localStorage, as we likely want one alert per day per lengthy break? 
        // Or if they take ANOTHER long break? 
        // If they end the break, the 'isOngoing' check handles it. 
        // If they resume work and take another break, breakHours resets (assuming total break hours is what we track).
        // If it's cumulative daily break, then one alert per day is correct.

        if (totalBreakMinutes <= 45) {
            breakNotificationSent.current = false;
        }
    }, [data?.breakHours, data?.isOngoing, employeeId]);

    if (isLoading) {
        return (
            <Card className="lg:col-span-1">
                <CardContent className="p-6">
                    <div className="flex items-center justify-center h-40">
                        <div className="text-center text-muted-foreground">
                            <IconCircleDotted className="h-8 w-8 animate-spin mx-auto mb-2" />
                            <p className="text-sm">Loading attendance...</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="lg:col-span-1 border-destructive/50">
                <CardContent className="p-6">
                    <div className="text-center text-destructive">
                        <p className="text-sm">Error loading attendance</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!data?.hasRecord) {
        return (
            <Card className="lg:col-span-1">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <IconClock className="h-5 w-5 text-muted-foreground" />
                        Live Attendance
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm">No attendance record for today</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const formatTime = (isoString?: string) => {
        if (!isoString) return '--:--';
        const date = new Date(isoString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    return (
        <Card className={cn(
            "lg:col-span-1 transition-all duration-300",
            data.isOngoing && "border-green-500/50 shadow-lg shadow-green-500/10"
        )}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        {data.isOngoing ? (
                            <>
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                </span>
                                <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent font-bold">
                                    Live Attendance
                                </span>
                            </>
                        ) : (
                            <>
                                <IconClock className="h-5 w-5 text-muted-foreground" />
                                Attendance
                            </>
                        )}
                    </CardTitle>

                </div>

            </CardHeader>

            <CardContent className="space-y-4">
                {/* In/Out Times - Prominent Display */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5 p-3 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
                        <div className="flex items-center gap-1.5 text-xs text-blue-600 font-medium">
                            <IconLogin className="h-3.5 w-3.5" />
                            <span>In</span>
                        </div>
                        <div className="text-xl font-bold text-blue-700">
                            {formatTime(data.inTime)}
                        </div>
                    </div>

                    <div className={cn(
                        "space-y-1.5 p-3 rounded-lg border",
                        data.isOngoing
                            ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200"
                            : "bg-gradient-to-br from-slate-50 to-gray-50 border-slate-200"
                    )}>
                        <div className={cn(
                            "flex items-center gap-1.5 text-xs font-medium",
                            data.isOngoing ? "text-green-600" : "text-slate-600"
                        )}>
                            <IconLogout className="h-3.5 w-3.5" />
                            <span>Out</span>
                        </div>
                        <div className={cn(
                            "text-xl font-bold",
                            data.isOngoing ? "text-green-600" : "text-slate-700"
                        )}>
                            {data.isOngoing ? 'Ongoing' : formatTime(data.outTime)}
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Duration Metrics - Compact but Clear */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 rounded-md bg-green-50/50 border border-green-100/50">
                        <div className="flex items-center gap-2 text-xs text-green-700 font-medium">
                            <IconClock className="h-3.5 w-3.5" />
                            <span>Login</span>
                        </div>
                        <div className="text-lg font-bold tracking-wider text-green-600 tabular-nums">
                            {data.loginHours || '00:00:00'}
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-md bg-orange-50/50 border border-orange-100/50">
                        <div className="flex items-center gap-2 text-xs text-orange-700 font-medium">
                            <IconPlayerPause className="h-3.5 w-3.5" />
                            <span>Break</span>
                        </div>
                        <div className="text-lg font-bold tracking-wider text-orange-600 tabular-nums">
                            {data.breakHours || '00:00:00'}
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-md bg-blue-50/50 border border-blue-100/50">
                        <div className="flex items-center gap-2 text-xs text-blue-700 font-medium">
                            <IconClock className="h-3.5 w-3.5" />
                            <span>Total</span>
                        </div>
                        <div className="text-lg font-bold tracking-wider text-blue-600 tabular-nums">
                            {data.totalHours || '00:00:00'}
                        </div>
                    </div>
                </div>

                {/* Clock Times - Compact Pills */}
                {showClockTimes && data.clockTimes && data.clockTimes.length > 0 && (
                    <>
                        <Separator />
                        <div className="space-y-2">
                            <div className="text-xs font-medium text-muted-foreground">Clock Times</div>
                            <div className="flex flex-wrap gap-1.5">
                                {data.clockTimes.map((time, index) => (
                                    <Badge
                                        key={index}
                                        variant="outline"
                                        className="text-xs px-2 py-0.5 bg-slate-50 tabular-nums font-medium"
                                    >
                                        {time}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* Live Update Indicator */}
                {data.isOngoing && (
                    <div className="flex items-center justify-center gap-2 pt-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span className="text-xs text-green-600 font-medium">
                            Live updates • Syncs every 10s
                        </span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
