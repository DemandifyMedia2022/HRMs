'use client';

import { SidebarConfig } from '@/components/sidebar-config';
import { useRouteGuard } from '@/hooks/useRouteGuard';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis, ReferenceLine, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { IconCalendar, IconClock, IconChartDonut, IconHistory, IconGift, IconMessage, IconUserCheck, IconUserX, IconHourglass } from '@tabler/icons-react';
import { LiveAttendanceCard } from '@/components/LiveAttendanceCard';

export default function UserPage() {
  const { user, loading } = useRouteGuard('user');
  const [year] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(new Date().getMonth());
  const [data, setData] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<
    { date: string; event_name: string; event_start: string | null; event_end: string | null }[]
  >([]);
  const [error, setError] = useState<string>('');

  // DM dashboard and celebrations
  const [dmResourceStats, setDmResourceStats] = useState<{
    daily: { resource_name: string; total: number }[];
    monthly: { resource_name: string; total: number }[];
  } | null>(null);
  const [dmMode, setDmMode] = useState<'daily' | 'monthly'>('daily');
  const [dmLeadsStatus, setDmLeadsStatus] = useState<{ status: string; count: number }[] | null>(null);
  const [todayEvents, setTodayEvents] = useState<{
    birthdays: { name: string }[];
    anniversaries: { name: string; years: number }[];
  } | null>(null);
  const [dbRole, setDbRole] = useState<string>('');

  const toSecs = (v?: any) => {
    if (v == null) return 0;
    // Direct Date instance
    if (v instanceof Date && !isNaN(v.getTime())) {
      return v.getUTCHours() * 3600 + v.getUTCMinutes() * 60 + v.getUTCSeconds();
    }
    const s = String(v).trim();
    // HH:MM[:SS][.fraction][Z]
    const m = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?Z?$/);
    if (m) {
      const h = Number(m[1] || 0);
      const mm = Number(m[2] || 0);
      const ss = Number(m[3] || 0);
      return h * 3600 + mm * 60 + ss;
    }
    // ISO-like date e.g. 1970-01-01T08:24:21.000Z or DB time-as-date
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      return d.getUTCHours() * 3600 + d.getUTCMinutes() * 60 + d.getUTCSeconds();
    }
    // Numeric seconds
    const n = Number(s);
    if (Number.isFinite(n)) return Math.max(0, Math.floor(n));
    return 0;
  };

  const fmtHMS = (secs: number) => {
    const t = Math.max(0, Math.floor(secs));
    const h = String(Math.floor(t / 3600)).padStart(2, '0');
    const m = String(Math.floor((t % 3600) / 60)).padStart(2, '0');
    const s = String(t % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const formatTime = (value?: string | null) => {
    if (!value || value === 'N/A') return 'N/A';
    const v = String(value).trim();
    const m = v.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (m) {
      let h = Number(m[1]);
      const min = m[2];
      const ap = h >= 12 ? 'PM' : 'AM';
      h = h % 12;
      if (h === 0) h = 12;
      return `${String(h).padStart(2, '0')}:${min} ${ap}`;
    }
    const d = new Date(v);
    if (!isNaN(d.getTime()))
      return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true });
    return v;
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch(`/api/attendance/events?year=${year}`, { cache: 'no-store' });
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json();
        if (!ignore) {
          setData(json.result || []);
          setHolidays(json.holidays || []);
        }
      } catch (e: any) {
        if (!ignore) setError(e?.message || 'Failed to load');
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [year]);

  // Load DM charts and today celebrations
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const [dmrs, dmls, te] = await Promise.all([
          fetch(`/api/admin/dashboard/dm/resource-stats`).then(r => r.json()),
          fetch(`/api/admin/dashboard/dm/leads-by-status`).then(r => r.json()),
          fetch(`/api/admin/dashboard/today-events`).then(r => r.json())
        ]);
        if (ignore) return;
        setDmResourceStats(dmrs);
        setDmLeadsStatus(Array.isArray(dmls) ? dmls : (dmls?.data || []));
        setTodayEvents(te);
      } catch (e) {
        // ignore errors for optional widgets
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  // Fetch role/department from DB for current user (must be top-level hook)
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await fetch('/api/user/role', { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        if (!ignore && typeof json?.role === 'string') setDbRole(json.role);
      } catch { }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const me = user;
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;

  const selectedUser = useMemo(() => {
    if (!me) return undefined;
    // 1. Try matching by employee code if available
    const empCode = (me as any)?.emp_code != null ? String((me as any).emp_code) : null;
    if (empCode) {
      const byCode = data.find((u: any) => String(u.employeeId) === empCode);
      if (byCode) return byCode;
    }
    // 2. Fallback to name matching
    const nm = String(me.name || '')
      .trim()
      .toLowerCase();
    return (
      data.find((u: any) => u.employeeName?.toLowerCase() === nm) ||
      data.find((u: any) => u.employeeName?.toLowerCase().includes(nm))
    );
  }, [data, me]);

  const monthEvents = useMemo(() => {
    const evs: any[] = [];
    if (!selectedUser) return evs;
    for (const ev of selectedUser.events || []) {
      if (ev?.extendedProps?.date?.startsWith(monthKey)) evs.push(ev);
    }
    return evs;
  }, [selectedUser, monthKey]);

  const todayISO = new Date().toISOString().split('T')[0];
  const todayEvent = useMemo(() => monthEvents.find(e => e.extendedProps?.date === todayISO), [monthEvents, todayISO]);

  const kpis = useMemo(() => {
    let present = 0;
    let half = 0;
    let absent = 0;
    let totalSecs = 0;
    for (const e of monthEvents) {
      const s = String(e.extendedProps?.status || e.title || '');
      if (s === 'Present') present++;
      else if (s.toLowerCase().includes('half')) half++;
      else if (s === 'Absent') absent++;
      const dur = e.extendedProps?.total_hours ?? e.extendedProps?.login_hours;
      totalSecs += toSecs(dur);
    }
    return { present, half, absent, total: fmtHMS(totalSecs) };
  }, [monthEvents]);

  const hoursDaily = useMemo(() => {
    return monthEvents.map(e => {
      const dur = e.extendedProps?.total_hours ?? e.extendedProps?.login_hours;
      const h = toSecs(dur) / 3600;
      return { date: e.extendedProps?.date, hours: Math.round(h * 100) / 100 };
    });
  }, [monthEvents]);

  const statusDist = useMemo(() => {
    return [
      { name: 'Present', count: kpis.present },
      { name: 'Half-day', count: kpis.half },
      { name: 'Absent', count: kpis.absent }
    ];
  }, [kpis]);

  const chartHoursCfg: ChartConfig = { hours: { label: 'Hours', color: 'hsl(var(--primary))' } };
  const chartDistCfg: ChartConfig = { count: { label: 'Count', color: 'hsl(var(--primary))' } };

  const maxHours = useMemo(() => {
    return Math.max(0, ...hoursDaily.map(d => (Number.isFinite(d.hours) ? d.hours : 0)));
  }, [hoursDaily]);
  const noHoursData = maxHours === 0;

  if (loading) {
    return (
      <div className="p-6">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) return null;
  const dmRole = (dbRole || String((user as any)?.role || (user as any)?.department || '')).toLowerCase();
  const showDm = ['admin', 'operation', 'operations', 'quality', 'qa'].includes(dmRole);

  return (
    <>
      <SidebarConfig role="user" />
      <div className="p-6 space-y-6 pb-32">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              Good {(() => {
                const h = new Date().getHours();
                if (h < 12) return 'Morning';
                if (h < 18) return 'Afternoon';
                return 'Evening';
              })()}, {user.name?.split(' ')[0]}! <span className="text-3xl">👋</span>
            </h1>
            <p className="text-muted-foreground text-lg mt-1">
              Here&apos;s what&apos;s happening with you today.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link href="/pages/user/leaves/new">Request Leave</Link>
            </Button>
            <Button asChild>
              <Link href="/pages/user/attendance">View Attendance</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-emerald-200/80 bg-emerald-50/70 relative overflow-hidden">
            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-15 pointer-events-none">
              <IconUserCheck className="w-24 h-24 text-emerald-600" />
            </div>
            <CardHeader className="pb-2 space-y-1 relative z-10">
              <CardDescription>This Month</CardDescription>
              <CardTitle className="text-4xl">{kpis.present}</CardTitle>
            </CardHeader>
            <CardContent className="text-base text-muted-foreground relative z-10">Present days</CardContent>
          </Card>
          <Card className="border-amber-200/80 bg-amber-50/70 relative overflow-hidden">
            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-15 pointer-events-none">
              <IconHourglass className="w-24 h-24 text-amber-600" />
            </div>
            <CardHeader className="pb-2 space-y-1 relative z-10">
              <CardDescription>This Month</CardDescription>
              <CardTitle className="text-4xl">{kpis.half}</CardTitle>
            </CardHeader>
            <CardContent className="text-base text-muted-foreground relative z-10">Half-days</CardContent>
          </Card>
          <Card className="border-red-200/80 bg-red-50/70 relative overflow-hidden">
            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-15 pointer-events-none">
              <IconUserX className="w-24 h-24 text-red-600" />
            </div>
            <CardHeader className="pb-2 space-y-1 relative z-10">
              <CardDescription>This Month</CardDescription>
              <CardTitle className="text-4xl">{kpis.absent}</CardTitle>
            </CardHeader>
            <CardContent className="text-base text-muted-foreground relative z-10">Absents</CardContent>
          </Card>
          <Card className="border-blue-200/80 bg-blue-50/70 relative overflow-hidden">
            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-15 pointer-events-none">
              <IconClock className="w-24 h-24 text-blue-600" />
            </div>
            <CardHeader className="pb-2 space-y-1 relative z-10">
              <CardDescription>This Month</CardDescription>
              <CardTitle className="text-4xl">{kpis.total}</CardTitle>
            </CardHeader>
            <CardContent className="text-base text-muted-foreground relative z-10">Total work time</CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <LiveAttendanceCard
            employeeId={String(user?.emp_code || '')}
            showClockTimes={true}
          />

          <Card className="lg:col-span-2">
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>
                  <span className="flex items-center gap-2"><IconClock className="size-5 text-primary" /> Daily Hours</span>
                </CardTitle>
                <CardDescription>
                  {new Date(year, month).toLocaleString(undefined, { month: 'long', year: 'numeric' })}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setMonth(m => (m === 0 ? 11 : m - 1))}>
                  Prev
                </Button>
                <Button size="sm" variant="outline" onClick={() => setMonth(m => (m === 11 ? 0 : m + 1))}>
                  Next
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6 space-y-2">
              <ChartContainer config={chartHoursCfg} className="aspect-auto h-[260px] w-full">
                <AreaChart data={hoursDaily}>
                  <defs>
                    <linearGradient id="fillHours" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.9} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.15} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
                  <YAxis
                    domain={[0, Math.max(8, Math.ceil(maxHours + 1))]}
                    width={40}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={v => `${v}`}
                  />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent labelKey="date" />} />
                  <ReferenceLine y={8} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" />
                  <Area
                    dataKey="hours"
                    type="natural"
                    fill="url(#fillHours)"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    activeDot={{ r: 3 }}
                    connectNulls
                  />
                </AreaChart>
              </ChartContainer>
              {noHoursData ? (
                <div className="text-xs text-muted-foreground">No hours recorded for this month yet.</div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {/* Status Distribution as Ring */}
          <Card>
            <CardHeader>
              <CardTitle>
                <span className="flex items-center gap-2"><IconChartDonut className="size-5 text-primary" /> Status Distribution</span>
              </CardTitle>
              <CardDescription>This month</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
              <ChartContainer config={chartDistCfg} className="aspect-auto h-[260px] w-full">
                <PieChart width={320} height={240}>
                  <Pie
                    data={statusDist.map(s => ({ name: s.name, value: s.count }))}
                    dataKey="value"
                    nameKey="name"
                    cx={160}
                    cy={110}
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {statusDist.map((_, i) => (
                      <Cell key={i} fill={["var(--primary)", "#3fc8c3ff", "#3f94c8ff"][i % 3]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Previous Day Attendance */}
          <Card className="relative overflow-hidden">

            <CardHeader className="relative z-10">
              <CardTitle>
                <span className="flex items-center gap-2"><IconHistory className="size-5 text-primary" /> Previous Day</span>
              </CardTitle>
              <CardDescription>
                {new Date(Date.now() - 24 * 3600 * 1000).toISOString().split('T')[0]}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 relative z-10">
              {(() => {
                const prevISO = new Date(Date.now() - 24 * 3600 * 1000).toISOString().split('T')[0];
                const prevEvent = monthEvents.find(e => e.extendedProps?.date === prevISO);
                if (!prevEvent) return <div className="text-sm text-muted-foreground">No record for previous day.</div>;
                return (
                  <>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{prevEvent.extendedProps?.status || prevEvent.title}</Badge>
                    </div>
                    <div className="text-sm">
                      {formatTime(prevEvent.extendedProps?.in_time)} - {formatTime(prevEvent.extendedProps?.out_time)}
                    </div>
                    <div className="text-sm">
                      Work {fmtHMS(toSecs(prevEvent.extendedProps?.total_hours ?? prevEvent.extendedProps?.login_hours))}
                    </div>
                    <Button asChild size="sm" variant="secondary">
                      <a href="/pages/user/attendance">View Full Attendance</a>
                    </Button>
                  </>
                );
              })()}
            </CardContent>
          </Card>

          {/* Events Today (Birthdays & Anniversaries) */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-100 shadow-sm">
            <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
              <IconGift className="w-48 h-48 text-indigo-500" />
            </div>
            <div className="absolute top-4 right-4 opacity-10 pointer-events-none">
              <IconGift className="w-12 h-12 text-indigo-500 rotate-12" />
            </div>
            <CardHeader className="relative z-10">
              <CardTitle className="text-indigo-950">
                <span className="flex items-center gap-2"><IconGift className="size-5 text-indigo-600" /> Events Today</span>
              </CardTitle>
              <CardDescription className="text-indigo-600/80">Birthdays & Anniversaries</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm relative z-10">
              <div>
                <div className="text-indigo-900 font-semibold">Birthdays</div>
                <div className="mt-1 space-y-1">
                  {(todayEvents?.birthdays || []).length === 0 && (
                    <div className="text-indigo-600/60">None</div>
                  )}
                  {(todayEvents?.birthdays || []).map((b, i) => (
                    <div key={`b-${i}`} className="text-indigo-900">{b.name}</div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-indigo-900 font-semibold">Anniversaries</div>
                <div className="mt-1 space-y-1">
                  {(todayEvents?.anniversaries || []).length === 0 && (
                    <div className="text-indigo-600/60">None</div>
                  )}
                  {(todayEvents?.anniversaries || []).map((a, i) => (
                    <div key={`a-${i}`} className="text-indigo-900">{a.name} • {a.years} yrs</div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-indigo-900 font-semibold">Upcoming Holidays</div>
                <div className="mt-1 space-y-1">
                  {holidays.slice(0, 3).map(h => (
                    <div key={`${h.date}-${h.event_name}`} className="text-indigo-900">
                      {h.date} • {h.event_name}
                    </div>
                  ))}
                  {holidays.length === 0 && <div className="text-indigo-600/60">No upcoming holidays</div>}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {error ? <div className="text-sm text-red-600">{error}</div> : null}

        {/* DM Charts moved to bottom and restricted to admin/operation/quality */}
        {
          showDm ? (
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader className="flex-row items-center justify-between">
                  <div>
                    <CardTitle>Resource Performance</CardTitle>
                    <CardDescription>{dmMode === 'daily' ? 'Today' : 'This Month'}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant={dmMode === 'daily' ? 'default' : 'outline'} onClick={() => setDmMode('daily')}>
                      Daily
                    </Button>
                    <Button size="sm" variant={dmMode === 'monthly' ? 'default' : 'outline'} onClick={() => setDmMode('monthly')}>
                      Monthly
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                  <ChartContainer config={{ total: { label: 'Total', color: 'hsl(var(--primary))' } }} className="aspect-auto h-[280px] w-full">
                    <BarChart
                      data={
                        ((dmMode === 'daily' ? dmResourceStats?.daily : dmResourceStats?.monthly) || [])
                          .filter(d => dmMode !== 'daily' || (typeof d.total === 'number' && d.total > 0))
                          .slice()
                          .sort((a, b) => String(a.resource_name || '').localeCompare(String(b.resource_name || '')))
                      }
                    >
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="resource_name" tickLine={false} axisLine={false} tickMargin={8} interval={0} angle={-20} height={60} />
                      <YAxis allowDecimals={false} width={30} tickLine={false} axisLine={false} tickMargin={8} />
                      <ChartTooltip cursor={false} content={<ChartTooltipContent labelKey="resource_name" />} />
                      <Bar dataKey="total" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Leads by QA Status</CardTitle>
                  <CardDescription>Distribution</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center">
                  <ChartContainer config={{}} className="aspect-auto h-[280px] w-full">
                    <PieChart width={280} height={240}>
                      <Pie
                        data={(Array.isArray(dmLeadsStatus) ? dmLeadsStatus : []).map((x, i) => ({ name: x.status || 'pending', value: x.count }))}
                        dataKey="value"
                        nameKey="name"
                        cx={140}
                        cy={110}
                        innerRadius={50}
                        outerRadius={90}
                        paddingAngle={3}
                      >
                        {(Array.isArray(dmLeadsStatus) ? dmLeadsStatus : []).map((_, i) => (
                          <Cell key={i} fill={["#0ea5e9", "#22c55e", "#f97316", "#ef4444", "#a855f7", "#eab308", "#06b6d4", "#f43f5e"][i % 8]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          ) : null
        }
      </div >
    </>
  );
}
