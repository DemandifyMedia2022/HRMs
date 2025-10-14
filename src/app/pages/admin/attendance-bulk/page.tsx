"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Types aligned with existing Attendance events endpoint
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

export default function AdminAttendanceBulkPage() {
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(new Date().getMonth());
  const [status, setStatus] = useState<string>("");
  const [data, setData] = useState<UserEvents[]>([]);
  const [holidays, setHolidays] = useState<{ date: string; event_name: string; event_start: string | null; event_end: string | null }[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [query, setQuery] = useState<string>("");
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

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

  async function reloadEvents() {
    try {
      const res = await fetch(`/api/attendance/events?year=${year}`, { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      setData(json.result || []);
      setHolidays(json.holidays || []);
    } catch {}
  }

  const selectedUser = useMemo(() => {
    const q = (query).trim().toLowerCase();
    if (!q) return undefined;
    return data.find(
      (u) =>
        u.employeeName?.toLowerCase().includes(q) || String(u.employeeId).toLowerCase() === q
    );
  }, [data, query]);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [] as UserEvents[];
    return data
      .filter(
        (u) =>
          u.employeeName?.toLowerCase().includes(q) || String(u.employeeId).toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [data, query]);

  const calendar = useMemo(() => {
    const monthStart = new Date(Date.UTC(year, month, 1));
    const monthEnd = new Date(Date.UTC(year, month + 1, 0));
    const firstWeekday = monthStart.getUTCDay();
    const daysInMonth = monthEnd.getUTCDate();

    const headers = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const eventsMap = new Map<string, EventItem>();
    if (selectedUser) {
      for (const ev of selectedUser.events) {
        if (ev.extendedProps?.date?.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`)) {
          eventsMap.set(ev.extendedProps.date, ev);
        }
      }
    }

    // Map leaves by date for quick lookup
    const leaveMap = new Map<string, string>();
    if (selectedUser?.leaves) {
      selectedUser.leaves.forEach((l) => {
        if (l.date?.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`)) {
          leaveMap.set(l.date, l.leave_type || 'Leave');
        }
      });
    }

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

    return { headers, cells, leaveMap, holidayMap };
  }, [year, month, selectedUser, holidays]);

  function toggleDate(dateStr?: string) {
    if (!dateStr) return;
    setSelectedDates((prev) => {
      const next = new Set(prev);
      if (next.has(dateStr)) next.delete(dateStr);
      else next.add(dateStr);
      return next;
    });
  }

  async function submit() {
    setMessage("");
    if (!selectedUser) {
      setMessage("Please select a user from suggestions.");
      return;
    }
    if (!status) {
      setMessage("Please select a status.");
      return;
    }
    const dates = Array.from(selectedDates);
    if (dates.length === 0) {
      setMessage("Please select at least one date.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/attendance/bulk-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emp_code: String(selectedUser.employeeId), status, selected_dates: dates }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to update attendance");
      }
      setMessage(`Updated: ${json.updated || 0}, Inserted: ${json.inserted || 0}`);
      // Optionally refresh events to reflect changes
      setSelectedDates(new Set());
      await reloadEvents();
    } catch (e: any) {
      setMessage(e?.message || "Request failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-xl font-semibold">Bulk Update Attendance</h1>
        <div className="flex items-center gap-2">
          {/* <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-[120px]"><SelectValue placeholder="Year" /></SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Month" /></SelectTrigger>
            <SelectContent>
              {months.map((m, i) => (
                <SelectItem key={m} value={String(i)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select> */}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle>Pick User, Dates and Status</CardTitle>
            <div className="flex items-center gap-2 text-xs">
              <Badge variant="outline" className="border-green-500 text-green-600">Present</Badge>
              <Badge variant="outline" className="border-orange-500 text-orange-600">Half-day</Badge>
              <Badge variant="outline" className="border-red-500 text-red-600">Absent</Badge>
              <Badge variant="outline" className="border-purple-700 text-purple-700">Holiday</Badge>
              <Badge variant="outline" className="border-blue-500 text-blue-600">Leave</Badge>
              <Badge variant="outline" className="border-gray-400 text-gray-600">Other</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-sm">Loading…</div>
          ) : error ? (
            <div className="text-sm text-red-600">{error}</div>
          ) : (
            <>
              <div className="flex gap-3 items-end flex-wrap">
                <div className="space-y-1 relative">
                  <div className="text-sm">Search User</div>
                  <Input
                    className="w-64"
                    placeholder="Type name or employee id..."
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  />
                  {showSuggestions && suggestions.length > 0 ? (
                    <div className="absolute z-10 mt-1 w-64 max-h-56 overflow-auto rounded border bg-white shadow">
                      {suggestions.map((u) => (
                        <button
                          key={String(u.employeeId)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setQuery(String(u.employeeName));
                            setShowSuggestions(false);
                          }}
                        >
                          {u.employeeName} ({u.employeeId})
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="space-y-1">
                  <div className="text-sm">Status</div>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-[160px]"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Present">Present</SelectItem>
                      <SelectItem value="Half-day">Half-day</SelectItem>
                      <SelectItem value="Absent">Absent</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <Button variant="outline" onClick={() => setSelectedDates(new Set())}>Clear Selection</Button>
                  <Button onClick={submit} disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit Bulk Update"}
                  </Button>
                </div>
              </div>

              {selectedUser ? (
                <div className="text-sm text-gray-700">Selected user: {selectedUser.employeeName} ({selectedUser.employeeId})</div>
              ) : (
                <div className="text-sm text-gray-500">Select a user from suggestions to proceed.</div>
              )}
              {message ? <div className="text-sm text-blue-700">{message}</div> : null}

              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">{months[month]} {year}</div>
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
                <div className="grid grid-cols-7 gap-2 text-xs">
                  {calendar.headers.map((h) => (
                    <div key={h} className="text-center font-medium text-gray-600">{h}</div>
                  ))}
                  {calendar.cells.map((c, idx) => {
                    const has = Boolean(c.day);
                    const isSelected = c.dateStr ? selectedDates.has(c.dateStr) : false;
                    const baseBorder = c.ev?.borderColor || "#d1d5db";
                    const isWeekend = c.dateStr ? (() => {
                      const d = new Date(c.dateStr + 'T00:00:00');
                      const w = d.getDay();
                      return w === 0 || w === 6;
                    })() : false;
                    const leaveType = c.dateStr ? calendar.leaveMap.get(c.dateStr) : undefined;
                    const holiday = c.dateStr ? calendar.holidayMap.get(c.dateStr) : undefined;
                    const isHoliday = Boolean(holiday);
                    const isLeave = Boolean(leaveType);
                    // priority: holiday (purple) > leave (blue) > weekend (gray) > event color
                    const cellBorder = isHoliday ? "#800080" : isLeave ? "#3b82f6" : (isWeekend ? "#9ca3af" : baseBorder);
                    return (
                      <div
                        key={idx}
                        className={`min-h-[90px] rounded border p-2 flex flex-col gap-1 cursor-pointer ${has ? (isHoliday || isLeave ? "bg-white" : (isWeekend ? "bg-gray-50" : "bg-white")) : "bg-gray-50"} ${isSelected ? "ring-2 ring-blue-500" : ""}`}
                        style={{ borderColor: cellBorder }}
                        onClick={() => has && toggleDate(c.dateStr)}
                        title={c.dateStr}
                      >
                        <div className="text-right text-xs text-gray-500">{c.day ?? ""}</div>
                        {isHoliday ? (
                          <div className="mt-auto text-[11px] text-purple-700">{holiday?.name}</div>
                        ) : isLeave ? (
                          isWeekend ? (
                            <div className="mt-auto text-[11px] text-gray-600">Week Off</div>
                          ) : (
                            <div className="mt-auto text-[11px] text-blue-600">{leaveType}</div>
                          )
                        ) : c.ev ? (
                          <div className="mt-auto text-[11px] text-gray-600">
                            {c.ev.extendedProps.status || c.ev.title}
                          </div>
                        ) : isWeekend ? (
                          <div className="mt-auto text-[11px] text-gray-600">Week Off</div>
                        ) : null}
                        {isSelected ? (
                          <div className="text-[10px] text-blue-600 mt-auto">Selected</div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
                <div className="text-xs text-gray-600 mt-2">Selected dates: {selectedDates.size}</div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
