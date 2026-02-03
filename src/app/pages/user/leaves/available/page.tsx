'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, ListChecks, RefreshCcw, User } from 'lucide-react';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { DatePicker } from '@/components/ui/date-picker';
import { Pie, PieChart, Cell } from 'recharts';

function PolicyStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md bg-slate-50/60 border border-slate-200 px-3 py-2">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="text-base font-semibold text-slate-900 mt-0.5">{value ?? '-'}</div>
    </div>
  );
}

function PolicySkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-md border border-slate-200 p-3">
          <div className="h-3 w-24 bg-slate-200 rounded mb-2" />
          <div className="h-5 w-16 bg-slate-200 rounded" />
        </div>
      ))}
    </div>
  );
}

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
  totals: {
    totalPaidLeave: number;
    totalSickLeave: number;
    accrual?: string;
    carryoverPaid?: number;
    carryoverSick?: number;
  };
  user: string;
  company?: string;
};

export default function UserAvailableLeavePage() {
  const searchParams = useSearchParams();
  const userFromQuery = useMemo(
    () => searchParams.get('user_name') || searchParams.get('added_by_user') || '',
    [searchParams]
  );

  const [userName, setUserName] = useState<string>('');
  const [data, setData] = useState<AvailableResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<Date | undefined>(new Date()); // default to current month

  // Store logged-in user profile (for nice display name)
  const [me, setMe] = useState<{ email?: string; name?: string; Full_name?: string } | null>(null);

  async function load(targetUser?: string) {
    const u = (targetUser ?? userName).trim();
    if (!u) return;
    setLoading(true);
    setError(null);
    try {
      const monthStr = selectedMonth ? selectedMonth.toISOString().slice(0, 7) : undefined;
      const qs = new URLSearchParams({
        user_name: u,
        ...(monthStr ? { month: monthStr } : {})
      });
      const res = await fetch(`/api/leaves/available?${qs.toString()}`, { cache: 'no-store' });
      const body = res.ok ? await res.json().catch(() => null) : null;
      if (!body || !Array.isArray(body?.LeaveApprovalData)) {
        throw new Error(body?.error || 'Failed to load available leaves');
      }
      setData(body as AvailableResponse);
    } catch (e: any) {
      setError(e?.message || 'Failed to load available leaves');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (userFromQuery) {
      setUserName(userFromQuery);
      load(userFromQuery);
    } else {
      (async () => {
        try {
          const meRes = await fetch('/api/auth/me', { cache: 'no-store' });
          let candidate = '';
          if (meRes.ok) {
            const meJson = await meRes.json();
            setMe(meJson); // capture for name+email display
            candidate = meJson?.email || meJson?.name || '';
          }
          if (candidate) {
            setUserName(candidate);
            load(candidate);
          } else {
            setError('Unable to determine current user. Please open with user_name param.');
          }
        } catch {
          setError('Unable to retrieve current user. Please open with user_name param.');
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userFromQuery, selectedMonth]);

  // Build “Full Name (email)” display
  const display = useMemo(() => {
    const email = (data?.user || userName || '').trim();
    const nameFromMe = (me?.Full_name || me?.name || '').trim();
    const localPart = email.includes('@') ? email.split('@')[0] : '';
    const name = nameFromMe || localPart || email;
    const emailToShow = email && email.includes('@') ? email : (me?.email || '');
    return emailToShow ? `${name} ${emailToShow}` : (name || 'Unknown');
  }, [data?.user, userName, me]);

  // Derive policy UI state from data (no extra API needed for users)
  const policyLoading = loading && !data;
  const policyError = error;
  const policy = data
    ? {
        total_paid_leave: data.totals?.totalPaidLeave ?? null,
        total_sick_leave: data.totals?.totalSickLeave ?? null,
        accrual: data.totals?.accrual ?? null,
        carryover_paid: data.totals?.carryoverPaid ?? null,
        carryover_sick: data.totals?.carryoverSick ?? null,
        company: data.company ?? 'Default'
      }
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50 to-indigo-50 p-4 md:p-6 pb-24">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-3">My Available Leave</h1>
            <p className="text-gray-600 mt-1 text-sm md:text-base">Company-specific policy applied automatically.</p>
          </div>
          <Badge variant="secondary" className="text-sm px-4 py-2 w-fit">
            Employee Portal
          </Badge>
        </div>

        {(policyLoading || policyError || policy !== null) && (
          <Card className="shadow-sm border-0 bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-slate-900">Leave Policy</CardTitle>
              <CardDescription className="text-slate-600">
                {policyLoading && 'Loading leave policy...'}
                {!policyLoading && policyError && <span className="text-red-600">{policyError}</span>}
                {!policyLoading && !policyError && policy === null && (
                  <span className="text-amber-600">
                    No policy found yet. Please contact HR if this seems incorrect.
                  </span>
                )}
                {!policyLoading && !policyError && policy && (
                  <>
                    Company: <span className="font-medium">{policy.company}</span>
                  </>
                )}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-0">
              {policyLoading && <PolicySkeleton />}

              {!policyLoading && policy && (
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <PolicyStat label="Total Paid Leave" value={policy.total_paid_leave ?? '-'} />
                    <PolicyStat label="Total Sick Leave" value={policy.total_sick_leave ?? '-'} />
                    <PolicyStat label="Accrual" value={policy.accrual || '-'} />
                    <PolicyStat label="Carryover Paid" value={policy.carryover_paid ?? 0} />
                    <PolicyStat label="Carryover Sick" value={policy.carryover_sick ?? 0} />
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                    <p className="text-[11px] leading-relaxed text-slate-500 flex gap-1.5">
                      <span className="shrink-0 text-blue-500">ⓘ</span>
                      <span>
                        Leave balances are calculated using your company policy. Accrual and carryover behavior depends on
                        the settings above.
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.8fr,1fr]">
          <Card className="shadow-md border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Check Leave Balance
              </CardTitle>
              <CardDescription>
                Logged in: <span className="font-medium text-gray-900">{display}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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

          {data && (
            <Card className="shadow-sm border-0 bg-white/70 backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-primary">
                  <ListChecks className="w-4 h-4" />
                  Approved Leaves
                </CardTitle>
                <CardDescription>Leaves with both HR and manager approval (current year).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-3xl font-semibold text-gray-900">{data?.approvedLeaves.length ?? 0}</div>
              </CardContent>
            </Card>
          )}
        </div>

        {data && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="shadow-sm border-0 bg-white/80 backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Paid Leave Usage</CardTitle>
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

            <Card className="shadow-sm border-0 bg-white/80 backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Sick Leave Usage</CardTitle>
                <CardDescription>Visual breakdown of sick leave consumption.</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  className="h-64"
                  config={{
                    Used: { label: 'Used', color: '#f39c9c' },
                    Remaining: { label: 'Remaining', color: '#c0392b' }
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
                      <Cell fill="#f39c9c" />
                      <Cell fill="#c0392b" />
                    </Pie>
                    <ChartLegend content={<ChartLegendContent />} />
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {data && (
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">All My Leaves</CardTitle>
                  <CardDescription>
                    Showing leaves for {selectedMonth?.toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) || 'All months'}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <DatePicker
                    value={selectedMonth}
                    onChange={setSelectedMonth}
                    placeholder="Select month"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Leave Type</TableHead>
                        <TableHead>Start</TableHead>
                        <TableHead>End</TableHead>
                        <TableHead>HR Approval</TableHead>
                        <TableHead>Manager Approval</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.LeaveApprovalData.map((l) => (
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
        )}
      </div>
    </div>
  );
}