'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { SidebarConfig } from '@/components/sidebar-config';

type EventItem = {
  title: string;
  start: string;
  textColor: string;
  backgroundColor: string;
  borderColor: string;
  extendedProps: {
    user: string;
    emp_code: string;
    date: string;
    in_time: string;
    out_time: string;
    shift_time?: string | null;
    login_hours: string;
    total_hours: string;
    break_hours: string;
    status: string;
    clock_times: string;
  };
};
// Format a clock time into 12-hour format like 10:00 AM
const formatTime = (value?: string | null) => {
  if (!value || value === 'N/A') return 'N/A';
  const v = String(value).trim();
  const m = v.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (m) {
    let h = Number(m[1]);
    const min = m[2];
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    return `${String(h).padStart(2, '0')}:${min} ${ampm}`;
  }
  const d2 = new Date(v);
  if (!isNaN(d2.getTime())) {
    return d2.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true });
  }
  return v;
};

type UserEvents = {
  employeeId: string;
  employeeName: string;
  events: EventItem[];
  leaves?: { date: string; leave_type: string; user: string }[];
};

export default function Page() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const setYear = (year: number) => {
    setCurrentDate(new Date(year, month, 1));
  };
  
  const setMonth = (month: number) => {
    setCurrentDate(new Date(year, month, 1));
  };
  const [data, setData] = useState<UserEvents[]>([]);
  const [holidays, setHolidays] = useState<
    { date: string; event_name: string; event_start: string | null; event_end: string | null }[]
  >([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [meName, setMeName] = useState<string>('');
  const [meEmpCode, setMeEmpCode] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const [selected, setSelected] = useState<{
    date?: string;
    isWeekend?: boolean;
    event?: EventItem;
    leaveType?: string;
    holidayName?: string;
    holidayStart?: string | null;
    holidayEnd?: string | null;
  }>({});

  // Format a duration-like value into HH:MM:SS (handles ISO strings like 1970-01-01T08:24:21.000Z)
  const formatDuration = (value?: string | null) => {
    if (!value || value === 'N/A') return 'N/A';
    const v = String(value).trim();
    // If already looks like HH:MM or HH:MM:SS, keep as is
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(v)) return v.length === 5 ? v : v;
    // Try parse as date/ISO
    const d = new Date(v);
    if (!isNaN(d.getTime())) {
      const hh = String(d.getUTCHours()).padStart(2, '0');
      const mm = String(d.getUTCMinutes()).padStart(2, '0');
      const ss = String(d.getUTCSeconds()).padStart(2, '0');
      return `${hh}:${mm}:${ss}`;
    }
    // If it's a numeric total seconds value
    const n = Number(v);
    if (!Number.isNaN(n)) {
      const total = Math.max(0, Math.floor(n));
      const hh = String(Math.floor(total / 3600)).padStart(2, '0');
      const mm = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
      const ss = String(total % 60).padStart(2, '0');
      return `${hh}:${mm}:${ss}`;
    }
    return v;
  };

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (!res.ok) return;
        const m = await res.json();
        if (!ignore) {
          setMeName(String(m?.name || ''));
          if (m?.emp_code != null) setMeEmpCode(String(m.emp_code));
        }
      } catch { }
    }
    init();
    return () => {
      ignore = true;
    };
  }, []);

  // Consolidated loader so we can call on year change and event changes
  const loadForYear = async (y: number) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/attendance/events?year=${y}`, { cache: 'no-store' });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `Failed: ${res.status}`);
      }
      const json = await res.json();
      setData(json.result || []);
      setHolidays(json.holidays || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  // Load on year or tick
  useEffect(() => {
    loadForYear(year);
  }, [year, refreshTick]);

  // Listen for events created/updated elsewhere and refresh
  useEffect(() => {
    const handler = () => setRefreshTick(t => t + 1);
    if (typeof window !== 'undefined') {
      window.addEventListener('events:changed', handler);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('events:changed', handler);
      }
    };
  }, []);

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    // Generate an array of years from 2 years before to 3 years after current year
    return Array.from({ length: 6 }, (_, i) => currentYear - 2 + i);
  }, []);

  const months = useMemo(
    () => [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December'
    ],
    []
  );

  const selectedUser = useMemo(() => {
    // 1. Try matching by employee code if available
    if (meEmpCode) {
      const byCode = data.find(u => String(u.employeeId) === String(meEmpCode));
      if (byCode) return byCode;
    }

    // 2. Fallback to name matching
    if (!meName) return undefined;
    const q = meName.trim().toLowerCase();
    return (
      data.find(u => u.employeeName?.toLowerCase() === q) || data.find(u => u.employeeName?.toLowerCase().includes(q))
    );
  }, [data, meName, meEmpCode]);

  const calendar = useMemo(() => {
    const monthStart = new Date(Date.UTC(year, month, 1));
    const monthEnd = new Date(Date.UTC(year, month + 1, 0));
    const firstWeekday = monthStart.getUTCDay();
    const daysInMonth = monthEnd.getUTCDate();

    const headers = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const eventsMap = new Map<string, EventItem>();
    if (selectedUser) {
      for (const ev of selectedUser.events) {
        if (ev.extendedProps?.date?.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)) {
          eventsMap.set(ev.extendedProps.date, ev);
        }
      }
    }

    const leaveMap = new Map<string, string>();
    if (selectedUser?.leaves) {
      selectedUser.leaves.forEach(l => {
        if (l.date?.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)) {
          leaveMap.set(l.date, l.leave_type || 'Leave');
        }
      });
    }

    const holidayMap = new Map<string, { name: string; start: string | null; end: string | null }>();
    holidays.forEach(h => {
      if (h.date?.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)) {
        holidayMap.set(h.date, { name: h.event_name, start: h.event_start, end: h.event_end });
      }
    });

    const cells: Array<{ day?: number; dateStr?: string; ev?: EventItem }> = [];
    for (let i = 0; i < firstWeekday; i++) cells.push({});
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ day: d, dateStr, ev: eventsMap.get(dateStr) });
    }
    while (cells.length % 7 !== 0) cells.push({});

    return { headers, cells, leaveMap, holidayMap };
  }, [year, month, selectedUser, holidays]);

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <>
      <SidebarConfig role="user" />
      <div className="p-4 space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-xl font-semibold">User · Attendance</h1>
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="outline" className="border-green-500 text-green-600">
              Present
            </Badge>
            <Badge variant="outline" className="border-orange-500 text-orange-600">
              Half-day
            </Badge>
            <Badge variant="outline" className="border-red-500 text-red-600">
              Absent
            </Badge>
            <Badge variant="outline" className="border-purple-700 text-purple-700">
              Holiday
            </Badge>
            <Badge variant="outline" className="border-blue-500 text-blue-600">
              Leave
            </Badge>
            <Badge variant="outline" className="border-gray-400 text-gray-600">
              Other
            </Badge>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <CardTitle>My Monthly Attendance</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    const newDate = new Date(year, month - 1, 1);
                    setCurrentDate(newDate);
                  }}
                >
                  Prev
                </Button>
                <div className="text-sm">
                  {months[month]} {year}
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    const newDate = new Date(year, month + 1, 1);
                    setCurrentDate(newDate);
                  }}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm">Loading…</div>
            ) : error ? (
              <div className="text-sm text-red-600">{error}</div>
            ) : !selectedUser ? (
              <div className="text-sm text-gray-600">
                Your attendance is not available for {year}. If this persists, contact HR.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-7 gap-2 text-xs">
                  {calendar.headers.map(h => (
                    <div key={h} className="text-center font-medium text-gray-600">
                      {h}
                    </div>
                  ))}
                  {calendar.cells.map((c, idx) => {
                    const has = Boolean(c.day);
                    const status = c.ev?.extendedProps?.status || c.ev?.title || '';
                    const sLc = status.toLowerCase();
                    const isPresent = status === 'Present' || sLc.startsWith('present');
                    const isAbsent = status === 'Absent' || sLc.startsWith('absent');
                    const isHalf = sLc.includes('half');
                    const isPresentVariant = isPresent && (sLc.includes('late') || sLc.includes('early'));
                    const base =
                      isPresent
                        ? { border: '#10b981', bg: 'bg-emerald-50/50', text: 'text-emerald-700' }
                        : isAbsent
                          ? { border: '#ef4444', bg: 'bg-red-50/50', text: 'text-red-700' }
                          : isHalf
                            ? { border: '#f59e0b', bg: 'bg-amber-50/50', text: 'text-amber-700' }
                            : { border: '#d1d5db', bg: 'bg-white', text: 'text-gray-600' };
                    const textClass = isPresentVariant ? 'text-yellow-600' : base.text;
                    const isWeekend = c.dateStr
                      ? (() => {
                        const d = new Date(c.dateStr + 'T00:00:00');
                        const w = d.getDay();
                        return w === 0 || w === 6;
                      })()
                      : false;
                    const leaveType = c.dateStr ? calendar.leaveMap.get(c.dateStr) : undefined;
                    const holiday = c.dateStr ? calendar.holidayMap.get(c.dateStr) : undefined;
                    const isHoliday = Boolean(holiday);
                    const isLeave = Boolean(leaveType);
                    const isFuture = c.dateStr ? c.dateStr > todayStr : false;
                    const isNoRecord = has && !c.ev && !isHoliday && !isLeave && !isWeekend && !isFuture;
                    // priority: holiday (violet) > leave (sky) > weekend (zinc) > event color
                    const cellBorder = isHoliday
                      ? '#6d28d9'
                      : isLeave
                        ? '#0ea5e9'
                        : isWeekend
                          ? '#a1a1aa'
                          : isNoRecord
                            ? '#ef4444'
                            : base.border;
                    const isToday = c.dateStr === todayStr;
                    return (
                      <div
                        key={idx}
                        className={`relative min-h-[98px] rounded border p-2 flex flex-col gap-1 cursor-pointer transition-colors ${has ? (isHoliday ? 'bg-violet-50/40' : isLeave ? 'bg-sky-50/40' : isWeekend ? 'bg-gray-100' : isNoRecord ? 'bg-red-50/50' : base.bg) : 'bg-gray-100'} ${isToday ? 'ring-2 ring-primary' : ''}`}
                        style={{ borderColor: cellBorder }}
                        title={c.dateStr}
                        onClick={() => {
                          if (!has) return;
                          setSelected({
                            date: c.dateStr,
                            isWeekend,
                            event: c.ev,
                            leaveType,
                            holidayName: holiday?.name,
                            holidayStart: holiday?.start ?? null,
                            holidayEnd: holiday?.end ?? null
                          });
                          setOpen(true);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-[11px] text-gray-500">{c.day ?? ''}</div>
                          {isToday ? (
                            <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-1.5 py-0.5 text-[10px] font-medium">
                              Today
                            </span>
                          ) : null}
                        </div>
                        {isHoliday ? (
                          <div className="mt-auto text-[11px] text-purple-700">{holiday?.name}</div>
                        ) : isLeave ? (
                          isWeekend ? (
                            <div className="mt-auto text-[11px] text-gray-600">Week Off</div>
                          ) : (
                            <div className="mt-auto text-[11px] text-sky-600">{leaveType}</div>
                          )
                        ) : c.ev ? (
                          <div className="space-y-1">
                            <div className="text-[11px]">
                              <span className="inline-block rounded px-1 border" style={{ borderColor: cellBorder }}>
                                <span className={`font-medium ${textClass}`}>{status}</span>
                              </span>
                            </div>
                            <div className="text-[11px] text-gray-600">
                              {formatTime(c.ev.extendedProps.in_time)} - {formatTime(c.ev.extendedProps.out_time)}
                            </div>
                            <div className="text-[11px] text-gray-600">
                              Work {formatDuration(c.ev.extendedProps.login_hours)}
                            </div>
                          </div>
                        ) : isWeekend ? (
                          <div className="mt-auto text-[11px] text-gray-600">Week Off</div>
                        ) : isNoRecord ? (
                          <div className="mt-auto text-[11px] text-red-700">Absent</div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
                <div className="text-xs text-gray-600 mt-2">
                  Showing: {selectedUser.employeeName} ({selectedUser.employeeId})
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Attendance Details</DialogTitle>
              <DialogDescription>
                {selected.date} • {selectedUser?.employeeName} ({selectedUser?.employeeId})
              </DialogDescription>
            </DialogHeader>
            {selected.holidayName ? (
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-violet-600 text-violet-700 bg-violet-50">
                    Holiday
                  </Badge>
                  <span className="font-medium">{selected.holidayName}</span>
                </div>
                {selected.holidayStart || selected.holidayEnd ? (
                  <div className="text-gray-600">
                    {selected.holidayStart || ''} {selected.holidayEnd ? `→ ${selected.holidayEnd}` : ''}
                  </div>
                ) : null}
              </div>
            ) : selected.leaveType ? (
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-sky-500 text-sky-700 bg-sky-50">
                    Leave
                  </Badge>
                  <span className="font-medium">{selected.leaveType}</span>
                </div>
              </div>
            ) : selected.isWeekend ? (
              <div className="text-sm text-gray-600">Week Off</div>
            ) : selected.event ? (
              <div className="space-y-4 text-sm">
                <div className="flex items-center gap-2">
                  {(() => {
                    const s = selected.event?.extendedProps?.status || selected.event?.title || '';
                    const cls =
                      s === 'Present'
                        ? 'border-emerald-500 text-emerald-700 bg-emerald-50'
                        : s === 'Absent'
                          ? 'border-red-500 text-red-700 bg-red-50'
                          : s.toLowerCase().includes('half')
                            ? 'border-amber-500 text-amber-700 bg-amber-50'
                            : 'border-gray-300 text-gray-600';
                    return (
                      <Badge variant="outline" className={cls}>
                        {s || 'Status'}
                      </Badge>
                    );
                  })()}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {selected.event.extendedProps.shift_time ? (
                    <div>
                      <span className="text-gray-600">Shift:</span> {selected.event.extendedProps.shift_time}
                    </div>
                  ) : null}
                  {selected.event.extendedProps.in_time && selected.event.extendedProps.in_time !== 'N/A' ? (
                    <div>
                      <span className="text-gray-600">In:</span> {formatTime(selected.event.extendedProps.in_time)}
                    </div>
                  ) : null}
                  {selected.event.extendedProps.out_time && selected.event.extendedProps.out_time !== 'N/A' ? (
                    <div>
                      <span className="text-gray-600">Out:</span> {formatTime(selected.event.extendedProps.out_time)}
                    </div>
                  ) : null}
                  <div>
                    <span className="text-gray-600">Login:</span>{' '}
                    {formatDuration(selected.event.extendedProps.login_hours)}
                  </div>
                  <div>
                    <span className="text-gray-600">Break:</span>{' '}
                    {formatDuration(selected.event.extendedProps.break_hours)}
                  </div>
                  <div>
                    <span className="text-gray-600">Total:</span>{' '}
                    {formatDuration(selected.event.extendedProps.total_hours)}
                  </div>
                </div>
                {(() => {
                  const raw = selected.event?.extendedProps.clock_times;
                  let times: string[] = [];
                  try {
                    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                    if (Array.isArray(parsed)) times = parsed as string[];
                  } catch { }
                  return times.length > 0 ? (
                    <div className="space-y-2">
                      <div className="text-gray-600">Clock Times</div>
                      <div className="flex flex-wrap gap-2">
                        {times.map((t, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center rounded-md border px-2 py-1 text-[11px] text-gray-600"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            ) : (
              <div className="text-sm">No record for this day.</div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
