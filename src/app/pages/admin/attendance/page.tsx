"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import Link from "next/link";

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

  useEffect(() => {
    let ignore = false;
    async function run() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/attendance/events?year=${year}`, { cache: "no-store" });
        if (!res.ok) {
          const t = await res.text();
          throw new Error(t || `Failed: ${res.status}`);
        }
        const json = await res.json();
        if (!ignore) {
          setData(json.result || []);
          setHolidays(json.holidays || []);
        }
      } catch (e: any) {
        if (!ignore) setError(e?.message || "Failed to load");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    run();
    return () => {
      ignore = true;
    };
  }, [year]);

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-xl font-semibold">Attendance</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm">Search User</span>
            <Input
              className="w-56"
              placeholder="Type name or employee id..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
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
            <Link href="/pages/admin/attendance-bulk">
              <Button variant="secondary">Bulk Update</Button>
            </Link>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-sm">Loading…</div>
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
                      {u.employeeName} <span className="text-gray-500">({u.employeeId})</span>
                    </div>
                    <div className="flex gap-2 text-xs items-center">
                      <Badge variant="outline" className="border-green-500 text-green-600">Present</Badge>
                      <Badge variant="outline" className="border-orange-500 text-orange-600">Half-day</Badge>
                      <Badge variant="outline" className="border-red-500 text-red-600">Absent</Badge>
                      <Badge variant="outline" className="border-purple-700 text-purple-700">Holiday</Badge>
                      <Badge variant="outline" className="border-blue-500 text-blue-600">Leave</Badge>
                      <Badge variant="outline" className="border-gray-400 text-gray-600">Other</Badge>
                    </div>
                  </div>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>{months[month]} {year}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
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
                      <div className="grid grid-cols-7 gap-2 text-xs">
                        {headers.map((h) => (
                          <div key={h} className="text-center font-medium text-gray-600">{h}</div>
                        ))}
                        {cells.map((c, idx) => {
                          const baseBorder = c.ev?.borderColor || "#d1d5db";
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
                          // priority: holiday (purple) > leave (blue) > weekend (gray) > event color
                          const cellBorder = isHoliday ? "#800080" : isLeave ? "#3b82f6" : (isWeekend ? "#9ca3af" : baseBorder);
                          return (
                            <div
                              key={idx}
                              className={`min-h-[90px] rounded border p-2 flex flex-col gap-1 cursor-pointer ${has ? (isHoliday || isLeave ? "bg-white" : (isWeekend ? "bg-gray-50" : "bg-white")) : "bg-gray-50"}`}
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
                              <div className="text-right text-xs text-gray-500">{c.day ?? ""}</div>
                              {isHoliday ? (
                                <div className="mt-auto text-[11px] text-purple-700">{holiday?.name}</div>
                              ) : isLeave ? (
                                // On leave dates, show Week Off label for Sat/Sun, else show leave type
                                isWeekend ? (
                                  <div className="mt-auto text-[11px] text-gray-600">Week Off</div>
                                ) : (
                                  <div className="mt-auto text-[11px] text-blue-600">{leaveType}</div>
                                )
                              ) : c.ev ? (
                                <div className="space-y-1">
                                  <div className="text-[11px]">
                                    <span className="inline-block rounded border px-1" style={{ borderColor: baseBorder }}>
                                      {c.ev.extendedProps.status || c.ev.title}
                                    </span>
                                  </div>
                                  {c.ev.extendedProps.shift_time ? (
                                    <div className="text-[10px] text-gray-600">{c.ev.extendedProps.shift_time}</div>
                                  ) : (
                                    <div className="text-[11px] text-gray-600">{c.ev.extendedProps.in_time} - {c.ev.extendedProps.out_time}</div>
                                  )}
                                  <div className="text-[11px] text-gray-600">Work {c.ev.extendedProps.login_hours}</div>
                                </div>
                              ) : isWeekend ? (
                                <div className="mt-auto text-[11px] text-gray-600">Week Off</div>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Attendance Details</DialogTitle>
            <DialogDescription>
              {selected.date} • {selected.userName} ({selected.employeeId})
            </DialogDescription>
          </DialogHeader>
          {selected.holidayName ? (
            <div className="space-y-2 text-sm">
              <div><span className="text-gray-500">Holiday:</span> {selected.holidayName}</div>
              {selected.holidayStart || selected.holidayEnd ? (
                <div className="text-gray-500">{selected.holidayStart || ''} {selected.holidayEnd ? `→ ${selected.holidayEnd}` : ''}</div>
              ) : null}
            </div>
          ) : selected.leaveType ? (
            <div className="text-sm">Leave: {selected.leaveType}</div>
          ) : selected.isWeekend ? (
            <div className="text-sm">Week Off</div>
          ) : selected.event ? (
            <div className="space-y-2 text-sm">
              <div><span className="text-gray-500">Status:</span> {selected.event.extendedProps.status || selected.event.title}</div>
              {selected.event.extendedProps.shift_time ? (
                <div><span className="text-gray-500">shift_time:</span> {selected.event.extendedProps.shift_time}</div>
              ) : null}
              {selected.event.extendedProps.in_time && selected.event.extendedProps.in_time !== 'N/A' ? (
                <div><span className="text-gray-500">in_time:</span> {selected.event.extendedProps.in_time}</div>
              ) : null}
              {selected.event.extendedProps.out_time && selected.event.extendedProps.out_time !== 'N/A' ? (
                <div><span className="text-gray-500">out_time:</span> {selected.event.extendedProps.out_time}</div>
              ) : null}
              <div><span className="text-gray-500">Login Hours:</span> {selected.event.extendedProps.login_hours}</div>
              <div><span className="text-gray-500">Break Hours:</span> {selected.event.extendedProps.break_hours}</div>
              <div><span className="text-gray-500">Total Hours:</span> {selected.event.extendedProps.total_hours}</div>
              {(() => {
                const raw = selected.event?.extendedProps.clock_times;
                let times: string[] = [];
                try {
                  const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                  if (Array.isArray(parsed)) times = parsed as string[];
                } catch {}
                return times.length > 0 ? (
                  <div>
                    <span className="text-gray-500">Clock Times:</span>
                    <ul className="list-disc pl-5 mt-1 space-y-1">
                      {times.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
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

