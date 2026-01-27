'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, BarChart3, CalendarRange, ListChecks, PlaneTakeoff, RefreshCcw, User } from 'lucide-react';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { Pie, PieChart, Cell, Bar, BarChart, XAxis, YAxis, ResponsiveContainer } from 'recharts';

type Leave = {
  l_id: number;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  HRapproval: string;
  Managerapproval: string;
};

type AvailableResponse = {
  approvedLeaves: Leave[];
  LeaveApprovalData: Leave[];
  usedPaidLeave: number;
  usedSickLeave: number;
  remainingPaidLeave: number;
  remainingSickLeave: number;
  totals: { totalPaidLeave: number; totalSickLeave: number };
  user: string;
  monthlyBreakdown?: Array<{
    month: string;
    monthIndex: number;
    paidDays: number;
    sickDays: number;
    totalDays: number;
    leaves: number;
  }>;
};

function UserAvailableLeavePageInner() {
  const searchParams = useSearchParams();
  const userFromQuery = useMemo(
    () => searchParams.get('user_name') || searchParams.get('added_by_user') || '',
    [searchParams]
  );

  const [userName, setUserName] = useState<string>('');
  const [data, setData] = useState<AvailableResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(targetUser?: string) {
    const u = (targetUser ?? userName).trim();
    if (!u) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/leaves/available?user_name=${encodeURIComponent(u)}`, { cache: 'no-store' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || 'Failed to load available leaves');
      }
      const json = (await res.json()) as AvailableResponse;

      const now = new Date();
      const year = now.getFullYear();
      const yearStart = new Date(year, 0, 1);
      yearStart.setHours(0, 0, 0, 0);
      const yearEnd = new Date(year, 11, 31);
      yearEnd.setHours(23, 59, 59, 999);

      const normalize = (d: Date) => {
        const x = new Date(d);
        x.setHours(0, 0, 0, 0);
        return x;
      };

      const daysInCurrentYear = (startISO: string, endISO: string) => {
        const start = new Date(startISO);
        const end = new Date(endISO);
        const startClamped = start < yearStart ? yearStart : start;
        const endClamped = end > yearEnd ? yearEnd : end;
        if (endClamped < yearStart || startClamped > yearEnd) return 0;
        const s = normalize(startClamped).getTime();
        const e = normalize(endClamped).getTime();
        return Math.max(1, Math.round((e - s) / 86400000) + 1);
      };

      const approvedCurrent = Array.isArray(json.approvedLeaves)
        ? json.approvedLeaves.filter(l => daysInCurrentYear(l.start_date, l.end_date) > 0)
        : [];
      const allCurrent = Array.isArray(json.LeaveApprovalData)
        ? json.LeaveApprovalData.filter(l => daysInCurrentYear(l.start_date, l.end_date) > 0)
        : [];

      const usedByType = (needle: string) =>
        approvedCurrent
          .filter(l => (l.leave_type || '').toLowerCase().includes(needle))
          .reduce((sum, l) => sum + daysInCurrentYear(l.start_date, l.end_date), 0);

      const usedPaidLeave = usedByType('paid');
      const usedSickLeave = usedByType('sick');

      // Calculate month-wise breakdown
      const monthlyBreakdown = Array.from({ length: 12 }, (_, monthIndex) => {
        const monthStart = new Date(year, monthIndex, 1);
        const monthEnd = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
        
        const monthName = monthStart.toLocaleDateString('en-US', { month: 'short' });
        
        const monthLeaves = approvedCurrent.filter(leave => {
          const leaveStart = new Date(leave.start_date);
          const leaveEnd = new Date(leave.end_date);
          
          // Check if leave overlaps with this month
          return leaveStart <= monthEnd && leaveEnd >= monthStart;
        });
        
        let paidDays = 0;
        let sickDays = 0;
        
        monthLeaves.forEach(leave => {
          const leaveStart = new Date(leave.start_date);
          const leaveEnd = new Date(leave.end_date);
          
          // Clamp to month boundaries
          const clampedStart = leaveStart < monthStart ? monthStart : leaveStart;
          const clampedEnd = leaveEnd > monthEnd ? monthEnd : leaveEnd;
          
          if (clampedStart <= clampedEnd) {
            const days = daysInCurrentYear(clampedStart.toISOString(), clampedEnd.toISOString());
            
            if (leave.leave_type?.toLowerCase().includes('paid')) {
              paidDays += days;
            } else if (leave.leave_type?.toLowerCase().includes('sick')) {
              sickDays += days;
            }
          }
        });
        
        return {
          month: monthName,
          monthIndex,
          paidDays,
          sickDays,
          totalDays: paidDays + sickDays,
          leaves: monthLeaves.length
        };
      });

      const totalPaidLeave = 12;
      const totalSickLeave = 6;

      const monthsElapsed = now.getMonth() + 1;
      const earnedPaid = Math.min(totalPaidLeave, monthsElapsed * (totalPaidLeave / 12));
      const earnedSick = Math.min(totalSickLeave, monthsElapsed * (totalSickLeave / 12));

      const remainingPaidLeave = Math.max(0, Number((earnedPaid - usedPaidLeave).toFixed(2)));
      const remainingSickLeave = Math.max(0, Number((earnedSick - usedSickLeave).toFixed(2)));

      setData({
        ...json,
        approvedLeaves: approvedCurrent,
        LeaveApprovalData: allCurrent,
        usedPaidLeave,
        usedSickLeave,
        remainingPaidLeave,
        remainingSickLeave,
        totals: { totalPaidLeave, totalSickLeave },
        user: json.user || u,
        monthlyBreakdown
      });
    } catch (e: any) {
      setError(e?.message || 'Failed to load available leaves');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (userFromQuery) {
      setUserName(userFromQuery);
      // auto-load when query param is present
      load(userFromQuery);
    } else {
      (async () => {
        try {
          const meRes = await fetch('/api/auth/me', { cache: 'no-store' });
          let candidate = '';
          if (meRes.ok) {
            const me = await meRes.json();
            candidate = me?.email || me?.name || '';
          }
          // Fallback: decode email from JWT in cookies if needed
          if (!candidate && typeof document !== 'undefined') {
            const match = document.cookie.match(/(?:^|; )access_token=([^;]+)/);
            if (match) {
              const token = decodeURIComponent(match[1]);
              const parts = token.split('.');
              if (parts.length >= 2) {
                try {
                  const payload = JSON.parse(atob(parts[1]));
                  candidate = payload?.email || '';
                } catch { }
              }
            }
          }
          if (candidate) {
            setUserName(candidate);
            load(candidate);
          } else {
            setError('Unable to determine current user. Please enter your email to load leave data.');
          }
        } catch {
          setError('Unable to retrieve current user. Please enter your email to load leave data.');
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userFromQuery]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50 to-indigo-50 p-4 md:p-6 pb-24">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-3">My Available Leave</h1>
            <p className="text-gray-600 mt-1 text-sm md:text-base">Track remaining balances, approvals, and leave history.</p>
          </div>
          <Badge variant="secondary" className="text-sm px-4 py-2 w-fit">
            Employee Portal
          </Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.8fr,1fr]">
          <Card className="shadow-md border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Check Leave Balance
              </CardTitle>
              <CardDescription>Enter a user name to view available leave.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-[2fr,auto]">
                <div className="space-y-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Employee</Label>
                    <div className="grid grid-cols-[1fr_auto] gap-2">
                      <Input
                        placeholder="user email (e.g. name@company.com)"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                      />
                      <Button type="button" onClick={() => load(userName)}>Load</Button>
                    </div>
                  </div>
                </div>


              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {loading && (
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <RefreshCcw className="w-4 h-4 animate-spin" />
                  Loading leave data...
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm border-0 bg-white/70 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-primary">
                <ListChecks className="w-4 h-4" />
                Approved Leaves
              </CardTitle>
              <CardDescription>Summary of fully approved requests.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="text-3xl font-semibold text-gray-900">{data?.approvedLeaves.length ?? 0}</div>
              <p className="text-sm text-muted-foreground">Leaves with both HR and manager approval.</p>
            </CardContent>
          </Card>
        </div>

        {data && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <PlaneTakeoff className="h-5 w-5" />
                    Paid Leave Usage
                  </CardTitle>
                  <CardDescription>Visual breakdown of paid leave consumption.</CardDescription>
                </CardHeader>
                <CardContent>
                  {data.usedPaidLeave === 0 && data.remainingPaidLeave === 0 ? (
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <PlaneTakeoff className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No paid leave data available</p>
                      </div>
                    </div>
                  ) : (
                    <ChartContainer
                      className="h-64"
                      config={{
                        Used: { label: 'Used', color: '#ef4444' },
                        Remaining: { label: 'Remaining', color: '#22c55e' }
                      }}
                    >
                      <PieChart>
                        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                        <Pie
                          data={[
                            { name: 'Used', value: Math.max(0, data.usedPaidLeave) },
                            { name: 'Remaining', value: Math.max(0, data.remainingPaidLeave) }
                          ]}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={60}
                          outerRadius={90}
                          strokeWidth={6}
                        >
                          <Cell fill="#ef4444" />
                          <Cell fill="#22c55e" />
                        </Pie>
                        <ChartLegend content={<ChartLegendContent />} />
                      </PieChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Sick Leave Usage
                  </CardTitle>
                  <CardDescription>Visual breakdown of sick leave consumption.</CardDescription>
                </CardHeader>
                <CardContent>
                  {data.usedSickLeave === 0 && data.remainingSickLeave === 0 ? (
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No sick leave data available</p>
                      </div>
                    </div>
                  ) : (
                    <ChartContainer
                      className="h-64"
                      config={{
                        Used: { label: 'Used', color: '#f97316' },
                        Remaining: { label: 'Remaining', color: '#06b6d4' }
                      }}
                    >
                      <PieChart>
                        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                        <Pie
                          data={[
                            { name: 'Used', value: Math.max(0, data.usedSickLeave) },
                            { name: 'Remaining', value: Math.max(0, data.remainingSickLeave) }
                          ]}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={60}
                          outerRadius={90}
                          strokeWidth={6}
                        >
                          <Cell fill="#f97316" />
                          <Cell fill="#06b6d4" />
                        </Pie>
                        <ChartLegend content={<ChartLegendContent />} />
                      </PieChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Month-wise Leave Breakdown Chart */}
            {data.monthlyBreakdown && data.monthlyBreakdown.some(m => m.totalDays > 0) && (
              <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Monthly Leave Breakdown
                  </CardTitle>
                  <CardDescription>Month-wise distribution of paid and sick leaves taken this year.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    className="h-80"
                    config={{
                      paidDays: { label: 'Paid Leave Days', color: '#3b82f6' },
                      sickDays: { label: 'Sick Leave Days', color: '#ef4444' }
                    }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.monthlyBreakdown}>
                        <XAxis 
                          dataKey="month" 
                          tick={{ fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <ChartTooltip 
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-white p-3 border rounded-lg shadow-lg">
                                  <p className="font-medium">{label}</p>
                                  <p className="text-sm text-blue-600">
                                    Paid Leave: {data.paidDays} days
                                  </p>
                                  <p className="text-sm text-red-600">
                                    Sick Leave: {data.sickDays} days
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    Total: {data.totalDays} days ({data.leaves} requests)
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar 
                          dataKey="paidDays" 
                          fill="#3b82f6" 
                          name="Paid Leave Days"
                          radius={[0, 0, 4, 4]}
                        />
                        <Bar 
                          dataKey="sickDays" 
                          fill="#ef4444" 
                          name="Sick Leave Days"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}

            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">All My Leaves</CardTitle>
                <CardDescription>Review every leave request and its approval status.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Start</TableHead>
                          <TableHead>End</TableHead>
                          <TableHead>HR</TableHead>
                          <TableHead>Mgr</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.LeaveApprovalData.map(l => (
                          <TableRow key={l.l_id}>
                            <TableCell className="font-medium">{l.leave_type}</TableCell>
                            <TableCell>{new Date(l.start_date).toLocaleDateString()}</TableCell>
                            <TableCell>{new Date(l.end_date).toLocaleDateString()}</TableCell>
                            <TableCell>{l.HRapproval}</TableCell>
                            <TableCell>{l.Managerapproval}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UserAvailableLeavePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UserAvailableLeavePageInner />
    </Suspense>
  );
}