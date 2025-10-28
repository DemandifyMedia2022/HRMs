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

  const me = user;
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;

  const selectedUser = useMemo(() => {
    if (!me) return undefined;
    const empCode = (me as any)?.emp_code != null ? String((me as any).emp_code) : null;
    if (empCode) {
      const byCode = data.find((u: any) => String(u.employeeId) === empCode);
      if (byCode) return byCode;
    }
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

  return (
    <>
      <SidebarConfig role="user" />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-lg">👋</div>
            <div>
              <h1 className="text-2xl font-semibold leading-tight">Welcome, {user.name} <span className="align-middle">🎉</span></h1>
            </div>
          </div>
          {(todayEvents?.birthdays?.length || 0) > 0 || (todayEvents?.anniversaries?.length || 0) > 0 ? (
            <div className="ml-auto">
              <Card className="min-w-[280px] max-w-[340px] shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle>🎉 Celebrations Today</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(todayEvents?.birthdays?.length || 0) > 0 ? (
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-2">🎂 Birthdays</div>
                      <div className="space-y-2 max-h-40 overflow-auto pr-1">
                        {(todayEvents?.birthdays || []).map((b, i) => (
                          <div key={i} className="flex items-center justify-between rounded-md border p-2">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-semibold">
                                {(b.name || ' ').split(' ').map(s => s[0]).slice(0,2).join('').toUpperCase()}
                              </div>
                              <div className="text-sm font-medium">{b.name}</div>
                            </div>
                            <span>🎂</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {(todayEvents?.anniversaries?.length || 0) > 0 ? (
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-2">🎊 Anniversaries</div>
                      <div className="space-y-2 max-h-40 overflow-auto pr-1">
                        {(todayEvents?.anniversaries || []).map((a, i) => (
                          <div key={i} className="flex items-center justify-between rounded-md border p-2">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-semibold">
                                {(a.name || ' ').split(' ').map(s => s[0]).slice(0,2).join('').toUpperCase()}
                              </div>
                              <div className="text-sm font-medium">{a.name}</div>
                            </div>
                            <Badge variant="secondary">🎊 {a.years} yrs</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          ) : null}
        </div>

        {/* Actions row placed above KPI cards */}
        <div className="flex items-center justify-end gap-2">
          <Button asChild variant="outline">
            <Link href="/pages/user/leaves/new">Request Leave</Link>
          </Button>
          <Button asChild>
            <Link href="/pages/user/attendance">View Attendance</Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-emerald-200/80 bg-emerald-50/70">
            <CardHeader className="pb-2">
              <CardDescription>This Month</CardDescription>
              <CardTitle className="text-3xl">{kpis.present}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">Present days</CardContent>
          </Card>
          <Card className="border-amber-200/80 bg-amber-50/70">
            <CardHeader className="pb-2">
              <CardDescription>This Month</CardDescription>
              <CardTitle className="text-3xl">{kpis.half}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">Half-days</CardContent>
          </Card>
          <Card className="border-red-200/80 bg-red-50/70">
            <CardHeader className="pb-2">
              <CardDescription>This Month</CardDescription>
              <CardTitle className="text-3xl">{kpis.absent}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">Absents</CardContent>
          </Card>
          <Card className="border-blue-200/80 bg-blue-50/70">
            <CardHeader className="pb-2">
              <CardDescription>This Month</CardDescription>
              <CardTitle className="text-3xl">{kpis.total}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">Total work time</CardContent>
          </Card>
        </div>

        {/* DM Charts: Resource performance & Leads status (same as Admin) */}
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
                      <Cell key={i} fill={["#0ea5e9","#22c55e","#f97316","#ef4444","#a855f7","#eab308","#06b6d4","#f43f5e"][i % 8]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Today</CardTitle>
              <CardDescription>{todayISO}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {todayEvent ? (
                <>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{todayEvent.extendedProps?.status || todayEvent.title}</Badge>
                  </div>
                  <div className="text-sm">
                    {formatTime(todayEvent.extendedProps?.in_time)} - {formatTime(todayEvent.extendedProps?.out_time)}
                  </div>
                  <div className="text-sm">
                    Work{' '}
                    {fmtHMS(toSecs(todayEvent.extendedProps?.total_hours ?? todayEvent.extendedProps?.login_hours))}
                  </div>
                  <Button asChild size="sm" variant="secondary">
                    <Link href="/pages/user/attendance">View Full Attendance</Link>
                  </Button>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">No record for today.</div>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Daily Hours</CardTitle>
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
          <Card className="lg:col-span-2 border-slate-200/80 bg-slate-50/70">
            <CardHeader>
              <CardTitle>Status Distribution</CardTitle>
              <CardDescription>This month</CardDescription>
            </CardHeader>
            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
              <ChartContainer config={chartDistCfg} className="aspect-auto h-[260px] w-full">
                <BarChart data={statusDist}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis allowDecimals={false} width={30} tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent labelKey="name" />} />
                  <Bar dataKey="count" fill="var(--primary)" fillOpacity={1} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming</CardTitle>
              <CardDescription>Leaves & Holidays</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <div className="text-muted-foreground">Holidays</div>
                <div className="mt-1 space-y-1">
                  {holidays.slice(0, 3).map(h => (
                    <div key={`${h.date}-${h.event_name}`}>
                      {h.date} • {h.event_name}
                    </div>
                  ))}
                  {holidays.length === 0 && <div className="text-muted-foreground">No upcoming holidays</div>}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {error ? <div className="text-sm text-red-600">{error}</div> : null}
      </div>
    </>
  );
}
