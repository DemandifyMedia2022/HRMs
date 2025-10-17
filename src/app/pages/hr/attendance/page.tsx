"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarConfig } from "@/components/sidebar-config";
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

type UserEvents = {
  employeeId: string;
  employeeName: string;
  events: EventItem[];
  leaves?: { date: string; leave_type: string; user: string }[];
};

export default function AdminAttendancePage() {
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(new Date().getMonth());
  const [query, setQuery] = useState<string>("");
  const [data, setData] = useState<UserEvents[]>([]);
  const [holidays, setHolidays] = useState<{ date: string; event_name: string; event_start: string | null; event_end: string | null }[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [open, setOpen] = useState<boolean>(false);
  const [selected, setSelected] = useState<{
    userName?: string;
    employeeId?: string;
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
    if (!value || value === "N/A") return "N/A";
    const v = String(value).trim();
    // If already looks like HH:MM or HH:MM:SS, keep as is
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(v)) return v.length === 5 ? v : v;
    // Try parse as date/ISO
    const d = new Date(v);
    if (!isNaN(d.getTime())) {
      const hh = String(d.getUTCHours()).padStart(2, "0");
      const mm = String(d.getUTCMinutes()).padStart(2, "0");
      const ss = String(d.getUTCSeconds()).padStart(2, "0");
      return `${hh}:${mm}:${ss}`;
    }
    // If it's a numeric total seconds value
    const n = Number(v);
    if (!Number.isNaN(n)) {
      const total = Math.max(0, Math.floor(n));
      const hh = String(Math.floor(total / 3600)).padStart(2, "0");
      const mm = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
      const ss = String(total % 60).padStart(2, "0");
      return `${hh}:${mm}:${ss}`;
    }
    return v;
  };

  // Format a clock time into 12-hour format like 10:00 AM
  const formatTime = (value?: string | null) => {
    if (!value || value === "N/A") return "N/A";
    const v = String(value).trim();
    const m = v.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (m) {
      let h = Number(m[1]);
      const min = m[2];
      const ampm = h >= 12 ? "PM" : "AM";
      h = h % 12;
      if (h === 0) h = 12;
      return `${String(h).padStart(2, "0")}:${min} ${ampm}`;
    }
    const d2 = new Date(v);
    if (!isNaN(d2.getTime())) {
      return d2.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true });
    }
    return v;
  };

  const years = useMemo(() => {
    const y = new Date().getFullYear();
    return [y - 1, y, y + 1];
  }, []);

  const months = useMemo(
    () => [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
    []
  );

  // First matched user for exports and single-calendar render
  const selectedUser = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return undefined;
    return data.find((u) =>
      u.employeeName?.toLowerCase().includes(q) || String(u.employeeId).toLowerCase().includes(q)
    );
  }, [query, data]);

  // Centralized load function so we can call it on mount, year change and event changes
  const loadForYear = async (y: number) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/attendance/events?year=${y}`, { cache: "no-store" });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `Failed: ${res.status}`);
      }
      const json = await res.json();
      setData(json.result || []);
      setHolidays(json.holidays || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  // Load on mount and when year changes
  useEffect(() => {
    loadForYear(year);
  }, [year]);

  // Refresh when events/holidays change (after creating/updating events)
  useEffect(() => {
    const handler = () => loadForYear(year);
    if (typeof window !== 'undefined') {
      window.addEventListener('events:changed', handler);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('events:changed', handler);
      }
    };
  }, [year]);
  
  return (
    <div className="p-4 space-y-6">
      <SidebarConfig role="admin" />
      <Card className="border-muted/40 bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <h1 className="text-xl font-semibold tracking-tight">Attendance</h1>
              <p className="text-sm text-muted-foreground">Search a user month-by-month.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Search</span>
                <Input
                  className="w-56"
                  placeholder="Type name or employee id..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                  <SelectTrigger className="w-[100px]"><SelectValue placeholder="Year" /></SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
                  <SelectTrigger className="w-[140px]"><SelectValue placeholder="Month" /></SelectTrigger>
                  <SelectContent>
                    {months.map((m, i) => (
                      <SelectItem key={m} value={String(i)}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    const m = month + 1; // 1-12
                    const url = `/api/attendance/export/monthly?year=${year}&month=${m}`;
                    window.open(url, "_blank");
                  }}
                >
                  Export All (CSV)
                </Button>
                <Button
                  variant="default"
                  disabled={!selectedUser}
                  onClick={() => {
                    if (!selectedUser) return;
                    const m = month + 1; // 1-12
                    const url = `/api/attendance/export/monthly-user?year=${year}&month=${m}&employeeId=${encodeURIComponent(String(selectedUser.employeeId))}`;
                    window.open(url, "_blank");
                  }}
                >
                  Export User (CSV)
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 14 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-md" />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : (
        <div className="space-y-6">
          {data.length === 0 ? (
            <div className="text-sm">No data</div>
          ) : (
            (() => {
              const filtered = data.filter((u) => {
                if (!query.trim()) return true;
                const q = query.trim().toLowerCase();
                return (
                  u.employeeName?.toLowerCase().includes(q) ||
                  String(u.employeeId).toLowerCase().includes(q)
                );
              });

              if (!query.trim()) {
                return <div className="text-sm text-gray-600">Type a user name or employee id to view one calendar.</div>;
              }

              if (filtered.length === 0) {
                return <div className="text-sm">No user found for "{query}"</div>;
              }

              const u = filtered[0];

              const monthStart = new Date(Date.UTC(year, month, 1));
              const monthEnd = new Date(Date.UTC(year, month + 1, 0));
              const firstWeekday = monthStart.getUTCDay();
              const daysInMonth = monthEnd.getUTCDate();
              const headers = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
              const todayStr = new Date().toISOString().split('T')[0];
              const eventsMap = new Map<string, EventItem>();
              for (const ev of u.events) {
                if (ev.extendedProps?.date?.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`)) {
                  eventsMap.set(ev.extendedProps.date, ev);
                }
              }

              // Map leaves by date for quick lookup
              const leaveMap = new Map<string, string>();
              (u.leaves || []).forEach((l) => {
                if (l.date?.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`)) {
                  leaveMap.set(l.date, l.leave_type || 'Leave');
                }
              });

              // Map holidays for the current month
              const holidayMap = new Map<string, { name: string; start: string | null; end: string | null }>();
              holidays.forEach((h) => {
                if (h.date?.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`)) {
                  holidayMap.set(h.date, { name: h.event_name, start: h.event_start, end: h.event_end });
                }
              });

              const cells: Array<{ day?: number; dateStr?: string; ev?: EventItem }> = [];
              for (let i = 0; i < firstWeekday; i++) cells.push({});
              for (let d = 1; d <= daysInMonth; d++) {
                const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                cells.push({ day: d, dateStr, ev: eventsMap.get(dateStr) });
              }
              while (cells.length % 7 !== 0) cells.push({});

              return (
                <section key={`${u.employeeId}-${u.employeeName}`} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">
                      {u.employeeName} <span className="text-muted-foreground">({u.employeeId})</span>
                    </div>
                    <div className="flex gap-2 text-xs items-center">
                      <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50">Present</Badge>
                      <Badge variant="outline" className="border-amber-500 text-amber-600 bg-amber-50">Half-day</Badge>
                      <Badge variant="outline" className="border-red-500 text-red-600 bg-red-50">Absent</Badge>
                      <Badge variant="outline" className="border-violet-600 text-violet-700 bg-violet-50">Holiday</Badge>
                      <Badge variant="outline" className="border-sky-500 text-sky-600 bg-sky-50">Leave</Badge>
                      <Badge variant="outline" className="border-gray-300 text-muted-foreground">Other</Badge>
                    </div>
                  </div>

                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base md:text-lg font-semibold">{months[month]} {year}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setMonth((m) => {
                                if (m === 0) {
                                  setYear((y) => y - 1);
                                  return 11;
                                }
                                return m - 1;
                              });
                            }}
                          >
                            Prev
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setMonth((m) => {
                                if (m === 11) {
                                  setYear((y) => y + 1);
                                  return 0;
                                }
                                return m + 1;
                              });
                            }}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-7 gap-1.5 text-xs">
                        {headers.map((h) => (
                          <div key={h} className="text-center font-medium text-muted-foreground py-1">{h}</div>
                        ))}
                        {cells.map((c, idx) => {
                          const status = c.ev?.extendedProps?.status || c.ev?.title || "";
                          const base = status === "Present"
                            ? { border: "#10b981", bg: "bg-emerald-50/50", text: "text-emerald-700" }
                            : status === "Absent"
                            ? { border: "#ef4444", bg: "bg-red-50/50", text: "text-red-700" }
                            : status?.toLowerCase().includes("half")
                            ? { border: "#f59e0b", bg: "bg-amber-50/50", text: "text-amber-700" }
                            : { border: "#d1d5db", bg: "bg-white", text: "text-muted-foreground" };
                          const has = Boolean(c.day);
                          const isWeekend = c.dateStr ? (() => {
                            const d = new Date(c.dateStr + 'T00:00:00');
                            const w = d.getDay();
                            return w === 0 || w === 6;
                          })() : false;
                          const leaveType = c.dateStr ? leaveMap.get(c.dateStr) : undefined;
                          const holiday = c.dateStr ? holidayMap.get(c.dateStr) : undefined;
                          const isHoliday = Boolean(holiday);
                          const isLeave = Boolean(leaveType);
                          // priority: holiday (violet) > leave (sky) > weekend (zinc) > event color
                          const cellBorder = isHoliday ? "#6d28d9" : isLeave ? "#0ea5e9" : (isWeekend ? "#a1a1aa" : base.border);
                          const isToday = c.dateStr === todayStr;
                          return (
                            <div
                              key={idx}
                              className={`relative min-h-[98px] rounded-md border p-2 flex flex-col gap-1 cursor-pointer transition-colors ${has ? (isHoliday ? "bg-violet-50/40" : isLeave ? "bg-sky-50/40" : (isWeekend ? "bg-muted/40" : base.bg)) : "bg-muted/40"} hover:bg-accent ${isToday ? "ring-2 ring-primary" : ""}`}
                              style={{ borderColor: cellBorder }}
                              onClick={() => {
                                if (!has) return;
                                setSelected({
                                  userName: u.employeeName,
                                  employeeId: String(u.employeeId),
                                  date: c.dateStr,
                                  isWeekend,
                                  event: c.ev,
                                  leaveType,
                                  holidayName: holiday?.name,
                                  holidayStart: holiday?.start ?? null,
                                  holidayEnd: holiday?.end ?? null,
                                });
                                setOpen(true);
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <div className="text-[11px] text-muted-foreground">{c.day ?? ""}</div>
                                {isToday ? (
                                  <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-1.5 py-0.5 text-[10px] font-medium">Today</span>
                                ) : null}
                              </div>
                              {isHoliday ? (
                                <div className="mt-auto text-[11px] text-violet-700">{holiday?.name}</div>
                              ) : isLeave ? (
                                // On leave dates, show Week Off label for Sat/Sun, else show leave type
                                isWeekend ? (
                                  <div className="mt-auto text-[11px] text-muted-foreground">Week Off</div>
                                ) : (
                                  <div className="mt-auto text-[11px] text-sky-700">{leaveType}</div>
                                )
                              ) : c.ev ? (
                                <div className="space-y-1">
                                  <div className="text-[11px]">
                                    <span className="inline-block rounded px-1 border" style={{ borderColor: cellBorder }}>
                                      <span className={`font-medium ${base.text}`}>
                                        {c.ev.extendedProps.status || c.ev.title}
                                      </span>
                                    </span>
                                  </div>
                                  {c.ev.extendedProps.shift_time ? (
                                    <div className="text-[11px] text-muted-foreground">{c.ev.extendedProps.shift_time}</div>
                                  ) : (
                                    <div className="text-[11px] text-muted-foreground">{c.ev.extendedProps.in_time} - {c.ev.extendedProps.out_time}</div>
                                  )}
                                  <div className="text-[11px] text-muted-foreground">Work {formatDuration(c.ev.extendedProps.login_hours)}</div>
                                </div>
                              ) : isWeekend ? (
                                <div className="mt-auto text-[11px] text-muted-foreground">Week Off</div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </section>
              );
            })()
          )}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Attendance Details</DialogTitle>
            <DialogDescription>
              {selected.date} • {selected.userName} ({selected.employeeId})
            </DialogDescription>
          </DialogHeader>
          {selected.holidayName ? (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-violet-600 text-violet-700 bg-violet-50">Holiday</Badge>
                <span className="font-medium">{selected.holidayName}</span>
              </div>
              {selected.holidayStart || selected.holidayEnd ? (
                <div className="text-muted-foreground">{selected.holidayStart || ''} {selected.holidayEnd ? `→ ${selected.holidayEnd}` : ''}</div>
              ) : null}
            </div>
          ) : selected.leaveType ? (
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-sky-500 text-sky-700 bg-sky-50">Leave</Badge>
                <span className="font-medium">{selected.leaveType}</span>
              </div>
            </div>
          ) : selected.isWeekend ? (
            <div className="text-sm text-muted-foreground">Week Off</div>
          ) : selected.event ? (
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-2">
                {(() => {
                  const s = selected.event?.extendedProps?.status || selected.event?.title || '';
                  const cls = s === 'Present'
                    ? 'border-emerald-500 text-emerald-700 bg-emerald-50'
                    : s === 'Absent'
                    ? 'border-red-500 text-red-700 bg-red-50'
                    : s.toLowerCase().includes('half')
                    ? 'border-amber-500 text-amber-700 bg-amber-50'
                    : 'border-gray-300 text-muted-foreground';
                  return <Badge variant="outline" className={cls}>{s || 'Status'}</Badge>;
                })()}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {selected.event.extendedProps.shift_time ? (
                  <div><span className="text-muted-foreground">Shift:</span> {selected.event.extendedProps.shift_time}</div>
                ) : null}
                {selected.event.extendedProps.in_time && selected.event.extendedProps.in_time !== 'N/A' ? (
                  <div><span className="text-muted-foreground">In:</span> {formatTime(selected.event.extendedProps.in_time)}</div>
                ) : null}
                {selected.event.extendedProps.out_time && selected.event.extendedProps.out_time !== 'N/A' ? (
                  <div><span className="text-muted-foreground">Out:</span> {formatTime(selected.event.extendedProps.out_time)}</div>
                ) : null}
                <div><span className="text-muted-foreground">Login:</span> {formatDuration(selected.event.extendedProps.login_hours)}</div>
                <div><span className="text-muted-foreground">Break:</span> {formatDuration(selected.event.extendedProps.break_hours)}</div>
                <div><span className="text-muted-foreground">Total:</span> {formatDuration(selected.event.extendedProps.total_hours)}</div>
              </div>
              {(() => {
                const raw = selected.event?.extendedProps.clock_times;
                let times: string[] = [];
                try {
                  const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                  if (Array.isArray(parsed)) times = parsed as string[];
                } catch {}
                return times.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-muted-foreground">Clock Times</div>
                    <div className="flex flex-wrap gap-2">
                      {times.map((t, i) => (
                        <span key={i} className="inline-flex items-center rounded-md border px-2 py-1 text-[11px] text-muted-foreground">
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
  );
}

