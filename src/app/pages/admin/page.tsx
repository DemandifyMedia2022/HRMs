"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { SidebarConfig } from "@/components/sidebar-config"
import { useRouteGuard } from "@/hooks/useRouteGuard"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis, ReferenceLine, PieChart, Pie, Cell, Tooltip } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"

export default function AdminPage() {
  const { user, loading } = useRouteGuard("admin")
  const [year] = useState<number>(new Date().getFullYear())
  const [month, setMonth] = useState<number>(new Date().getMonth())
  const [error, setError] = useState<string>("")

  // Dashboard API states
  const [headcount, setHeadcount] = useState<{ total: number; confirmed: number; probation: number } | null>(null)
  const [gender, setGender] = useState<{ male: number; female: number; other: number } | null>(null)
  const [breakdownBy, setBreakdownBy] = useState<"department">("department")
  const [breakdown, setBreakdown] = useState<{ name: string; count: number }[]>([])
  const [attToday, setAttToday] = useState<{ date: string; total: number; present: number; absent: number } | null>(null)
  const [attYesterday, setAttYesterday] = useState<{ date: string; total: number; present: number; absent: number } | null>(null)
  const [leavesToday, setLeavesToday] = useState<{ total: number; items: { type: string; count: number }[] } | null>(null)
  const [events, setEvents] = useState<{ days: number; birthdays: { name: string; date: string }[]; workAnniversaries: { name: string; date: string; years: number }[] } | null>(null)
  const [leavesFuture, setLeavesFuture] = useState<{ days: number; items: { date: string; total: number; types: { type: string; count: number }[] }[] } | null>(null)
  const [leaveTrends, setLeaveTrends] = useState<{ year: number; items: { month: number; types: { type: string; count: number }[] }[] } | null>(null)
  const [leaveRequests, setLeaveRequests] = useState<{ status: string; total: number; items: { id: number; type: string; start: string; end: string; reason: string; hrStatus: string; mgrStatus: string; requestedBy: string; requestedOn: string }[] } | null>(null)

  // Load dashboard aggregates
  useEffect(() => {
    let ignore = false
    ;(async () => {
      try {
        const y = new Date(); y.setDate(y.getDate()-1); const ymd = `${y.getFullYear()}-${String(y.getMonth()+1).padStart(2,'0')}-${String(y.getDate()).padStart(2,'0')}`
        const [hc, gd, br, at, ay, lt, ev, lf, ltr, lr] = await Promise.all([
          fetch(`/api/admin/dashboard/headcount`).then(r=>r.json()),
          fetch(`/api/admin/dashboard/gender`).then(r=>r.json()),
          fetch(`/api/admin/dashboard/breakdown?by=department`).then(r=>r.json()),
          fetch(`/api/admin/dashboard/attendance-today`).then(r=>r.json()),
          fetch(`/api/admin/dashboard/attendance-today?date=${ymd}`).then(r=>r.json()),
          fetch(`/api/admin/dashboard/leaves-today`).then(r=>r.json()),
          fetch(`/api/admin/dashboard/upcoming-events?days=14`).then(r=>r.json()),
          fetch(`/api/admin/dashboard/leaves-future?days=14`).then(r=>r.json()),
          fetch(`/api/admin/dashboard/leave-trends?year=${year}`).then(r=>r.json()),
          fetch(`/api/admin/dashboard/leave-requests?status=pending&limit=3`).then(r=>r.json()),
        ])
        if (ignore) return
        setHeadcount(hc)
        setGender(gd)
        setBreakdown(br.items || [])
        setAttToday(at)
        setAttYesterday(ay)
        setLeavesToday(lt)
        setEvents(ev)
        setLeavesFuture(lf)
        setLeaveTrends(ltr)
        setLeaveRequests(lr)
      } catch (e: any) {
        if (!ignore) setError(e?.message || "Failed to load dashboard")
      }
    })()
    return () => { ignore = true }
  }, [])

  // Legacy area chart removed from Admin (replaced by dashboard cards)
  const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`

  const toSecs = (v?: any) => {
    if (v == null) return 0
    if (v instanceof Date && !isNaN(v.getTime())) return v.getUTCHours() * 3600 + v.getUTCMinutes() * 60 + v.getUTCSeconds()
    const s = String(v).trim()
    const m = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?Z?$/)
    if (m) return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3] || 0)
    const d = new Date(s)
    if (!isNaN(d.getTime())) return d.getUTCHours() * 3600 + d.getUTCMinutes() * 60 + d.getUTCSeconds()
    const n = Number(s)
    return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0
  }

  const orgKpis = useMemo(() => {
    return {
      totalEmployees: headcount?.total || 0,
      present: attToday?.present || 0,
      half: 0,
      absent: attToday?.absent || 0,
      total: "--:--:--",
    }
  }, [headcount, attToday])

  const statusDist = useMemo(() => ([
    { name: "Present", count: orgKpis.present },
    { name: "Absent", count: orgKpis.absent },
  ]), [orgKpis])

  const dailyHours: { date: string; hours: number }[] = []

  const chartHoursCfg: ChartConfig = { hours: { label: "Hours", color: "hsl(var(--primary))" } }
  const chartDistCfg: ChartConfig = { count: { label: "Count", color: "hsl(var(--primary))" } }

  // Build monthly trends dataset
  const trendTypes = useMemo(() => {
    const s = new Set<string>()
    for (const m of (leaveTrends?.items || [])) for (const t of m.types) s.add(t.type)
    return Array.from(s)
  }, [leaveTrends])
  const trendData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => ({ label: new Date(0, i).toLocaleString(undefined, { month: 'short' }) }))
    for (let i = 0; i < 12; i++) {
      const rec = (leaveTrends?.items || []).find(x => x.month === i)
      for (const t of trendTypes) {
        ;(months[i] as any)[t] = rec ? (rec.types.find(y => y.type === t)?.count || 0) : 0
      }
    }
    return months as any[]
  }, [leaveTrends, trendTypes])
  const trendColors = ["#0ea5e9", "#22c55e", "#f97316", "#ef4444", "#a855f7", "#eab308"]

  if (loading) {
    return (
      <div className="p-6"><p>Loading...</p></div>
    )
  }

  if (!user) return null

  return (
    <>
      <SidebarConfig role="admin" />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold">Welcome, {user.name}</h1>
            <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString()}</p>
          </div>
        </div>

         

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-violet-200/80 bg-violet-50/70"><CardHeader className="pb-2"><CardDescription>Organization</CardDescription><CardTitle className="text-3xl">{headcount?.total ?? 0}</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">Total Employees</CardContent></Card>
          <Card className="border-emerald-200/80 bg-emerald-50/70"><CardHeader className="pb-2"><CardDescription>Attendance Today</CardDescription><CardTitle className="text-3xl">{attToday?.present ?? 0}</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">Present</CardContent></Card>
          <Card className="border-red-200/80 bg-red-50/70"><CardHeader className="pb-2"><CardDescription>Attendance Today</CardDescription><CardTitle className="text-3xl">{attToday?.absent ?? 0}</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">Absent</CardContent></Card>
          <Card className="border-sky-200/80 bg-sky-50/70"><CardHeader className="pb-2"><CardDescription>Leaves Today</CardDescription><CardTitle className="text-3xl">{leavesToday?.total ?? 0}</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">Approved</CardContent></Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Gender Ratio</CardTitle>
              <CardDescription>Organization</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
              <ChartContainer config={{}} className="aspect-auto h-[220px] w-full">
                <PieChart width={240} height={200}>
                  <Pie dataKey="value" data={[
                    { name: "Male", value: gender?.male ?? 0, color: "#2563eb" },
                    { name: "Female", value: gender?.female ?? 0, color: "#f43f5e" },
                    { name: "Other", value: gender?.other ?? 0, color: "#64748b" },
                  ]} cx={120} cy={90} innerRadius={50} outerRadius={80} paddingAngle={4}>
                    <Cell key="m" fill="#2563eb" />
                    <Cell key="f" fill="#f43f5e" />
                    <Cell key="o" fill="#64748b" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Headcount Breakdown</CardTitle>
                <CardDescription>By department</CardDescription>
              </div>
              <div className="flex items-center gap-2"></div>
            </CardHeader>
            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
              <ChartContainer config={{ count: { label: 'Count', color: 'hsl(var(--primary))' }}} className="aspect-auto h-[280px] w-full">
                <BarChart data={breakdown} layout="vertical">
                  <CartesianGrid horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={160} tickLine={false} axisLine={false} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent labelKey="name" />} />
                  <Bar dataKey="count" fill="var(--primary)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 lg:grid-cols-4">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Leave Trends</CardTitle>
              <CardDescription>{leaveTrends?.year || year}</CardDescription>
            </CardHeader>
            <CardContent className="px-2 pt-2">
              <ChartContainer config={{}} className="aspect-auto h-[280px] w-full">
                <BarChart data={trendData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis allowDecimals={false} width={30} tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                  {trendTypes.map((t, i) => (
                    <Bar key={t} dataKey={t} stackId="a" fill={trendColors[i % trendColors.length]} radius={[6,6,0,0]} />
                  ))}
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <div>
                  <CardTitle>Leave Requests</CardTitle>
                  <CardDescription>Latest pending (3)</CardDescription>
                </div>
                <Button asChild size="sm" variant="outline"><Link href="/pages/admin/leaves">View All</Link></Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {(leaveRequests?.items || []).length > 0 ? (
                (leaveRequests?.items || []).map((it) => (
                  <div key={it.id} className="rounded-md border p-2">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{it.requestedBy}</div>
                      <div className="text-xs text-muted-foreground">{new Date(it.requestedOn).toLocaleDateString()}</div>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{it.type}</span>
                      <span>{new Date(it.start).toLocaleDateString()} → {new Date(it.end).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-muted-foreground">No pending requests</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>Next 14 days</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <div className="text-muted-foreground mb-1">Birthdays</div>
                {(events?.birthdays || []).slice(0,6).map((b,i)=> (
                  <div key={i} className="flex items-center justify-between"><span>{b.name}</span><span className="text-muted-foreground">{b.date}</span></div>
                ))}
                {(!events?.birthdays || events.birthdays.length===0) && <div className="text-muted-foreground">No upcoming birthdays</div>}
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Work Anniversaries</div>
                {(events?.workAnniversaries || []).slice(0,6).map((a,i)=> (
                  <div key={i} className="flex items-center justify-between"><span>{a.name}</span><span className="text-muted-foreground">{a.date}</span></div>
                ))}
                {(!events?.workAnniversaries || events.workAnniversaries.length===0) && <div className="text-muted-foreground">No upcoming anniversaries</div>}
              </div>
            </CardContent>
          </Card>
        </div>
        {/* <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Employees on Leave Today</CardTitle>
              <CardDescription>Approved leaves by type</CardDescription>
            </CardHeader>
            <CardContent className="px-2 pt-2">
              <ChartContainer config={{ count: { label: 'Count', color: 'hsl(var(--primary))' }}} className="aspect-auto h-[240px] w-full">
                <BarChart data={leavesToday?.items || []}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="type" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis allowDecimals={false} width={30} tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent labelKey="type" />} />
                  <Bar dataKey="count" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Attendance</CardTitle>
              <CardDescription>Today and Yesterday</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-md border p-3">
                <div className="text-xs text-muted-foreground">Today ({attToday?.date || "--"})</div>
                <div className="mt-1 flex items-center justify-between text-sm"><span>Present</span><span className="font-semibold">{attToday?.present ?? 0}</span></div>
                <div className="flex items-center justify-between text-sm"><span>Absent</span><span className="font-semibold">{attToday?.absent ?? 0}</span></div>
                <div className="flex items-center justify-between text-sm"><span>Total</span><span className="font-semibold">{attToday?.total ?? 0}</span></div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-xs text-muted-foreground">Yesterday ({attYesterday?.date || "--"})</div>
                <div className="mt-1 flex items-center justify-between text-sm"><span>Present</span><span className="font-semibold">{attYesterday?.present ?? 0}</span></div>
                <div className="flex items-center justify-between text-sm"><span>Absent</span><span className="font-semibold">{attYesterday?.absent ?? 0}</span></div>
                <div className="flex items-center justify-between text-sm"><span>Total</span><span className="font-semibold">{attYesterday?.total ?? 0}</span></div>
              </div>
            </CardContent>
          </Card>
        </div> */}

        

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage core HRMS features</CardDescription>
              <div className="grid grid-cols-2 gap-4">
                <Button asChild size="lg" variant="outline"><Link href="/pages/admin/leaves">Manage Leaves</Link></Button>
                <Button asChild size="lg" variant="outline"><Link href="/pages/admin/attendance">Manage Attendance</Link></Button>
                <Button asChild size="lg" variant="outline"><Link href="/pages/admin/campaigns">Campaigns</Link></Button>
                <Button asChild size="lg" variant="outline"><Link href="/pages/admin/payroll">Payroll</Link></Button>
              </div>
            </CardHeader>
          </Card>
        </div>

        {error ? <div className="text-sm text-red-600">{error}</div> : null}
      </div>
    </>
  )
}