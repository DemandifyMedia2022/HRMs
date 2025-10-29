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
import { Pie, PieChart, Cell } from 'recharts';

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
      setData(json);
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
          if (meRes.ok) {
            const me = await meRes.json();
            const candidate: string = me?.name || me?.email || '';
            if (candidate) {
              setUserName(candidate);
              load(candidate);
            }
          }
        } catch (e) {}
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userFromQuery]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50 to-indigo-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-3">My Available Leave</h1>
            <p className="text-gray-600 mt-1">Track remaining balances, approvals, and leave history in one view.</p>
          </div>
          <Badge variant="secondary" className="text-sm px-4 py-2">
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
              <CardDescription>Enter a user name to view available leave or refresh your own data.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-[2fr,auto]">
                <div className="space-y-2">
                  <Label htmlFor="user-search" className="text-sm font-medium">
                    Employee
                  </Label>
                  <Input
                    id="user-search"
                    value={userName}
                    onChange={e => setUserName(e.target.value)}
                    placeholder="Search by user name"
                  />
                </div>
                <div className="flex flex-wrap items-end gap-2">
                  <Button
                    type="button"
                    className="min-w-[140px]"
                    onClick={() => load()}
                    disabled={loading || !userName.trim()}
                  >
                    View Leave
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => load(userName)}
                    disabled={loading || !userName.trim()}
                  >
                    Refresh
                  </Button>
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
                  <CardTitle className="flex items-center gap-2">Paid Leave Usage</CardTitle>
                  <CardDescription>Visual breakdown of paid leave consumption.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    className="h-64"
                    config={{
                      Used: { label: 'Used', color: '#5ea3f2' },
                      Remaining: { label: 'Remaining', color: '#125ca5' }
                    }}
                  >
                    <PieChart>
                      <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                      <Pie
                        data={[
                          { name: 'Used', value: data.usedPaidLeave },
                          { name: 'Remaining', value: data.remainingPaidLeave }
                        ]}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={60}
                        outerRadius={90}
                        strokeWidth={6}
                      >
                        <Cell fill="#5ea3f2" />
                        <Cell fill="#125ca5" />
                      </Pie>
                      <ChartLegend content={<ChartLegendContent />} />
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">Sick Leave Usage</CardTitle>
                  <CardDescription>Visual breakdown of sick leave consumption.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    className="h-64"
                    config={{
                      Used: { label: 'Used', color: '#5ea3f2' },
                      Remaining: { label: 'Remaining', color: '#125ca5' }
                    }}
                  >
                    <PieChart>
                      <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                      <Pie
                        data={[
                          { name: 'Used', value: data.usedSickLeave },
                          { name: 'Remaining', value: data.remainingSickLeave }
                        ]}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={60}
                        outerRadius={90}
                        strokeWidth={6}
                      >
                        <Cell fill="#5ea3f2" />
                        <Cell fill="#125ca5" />
                      </Pie>
                      <ChartLegend content={<ChartLegendContent />} />
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">All My Leaves</CardTitle>
                <CardDescription>Review every leave request and its approval status.</CardDescription>
              </CardHeader>
              <CardContent>
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
