'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
  totals: { totalPaidLeave: number; totalSickLeave: number; accrual?: string; carryoverPaid?: number; carryoverSick?: number };
  user: string;
  company?: string;
};

type SuggestItem = { email: string; name: string; fullName: string; company: string };

export default function HRAvailableLeavePage() {
  const searchParams = useSearchParams();
  const userFromQuery = useMemo(
    () => searchParams.get('user_name') || searchParams.get('added_by_user') || '',
    [searchParams]
  );

  const [targetUser, setTargetUser] = useState<string>(userFromQuery || '');
  const [data, setData] = useState<AvailableResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  
type CompanyPolicy = {
  total_paid_leave: number | null;
  total_sick_leave: number | null;
  accrual: string | null;
  carryover_paid: number | null;
  carryover_sick: number | null;
} | null;

const [policy, setPolicy] = useState<CompanyPolicy>(null);
const [policyLoading, setPolicyLoading] = useState(false);
const [policyError, setPolicyError] = useState<string | null>(null);
  

  const [me, setMe] = useState<{ email?: string; name?: string; Full_name?: string } | null>(null);

  // Suggestions
  const [suggestions, setSuggestions] = useState<SuggestItem[]>([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [highlight, setHighlight] = useState<number>(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const meRes = await fetch('/api/auth/me', { cache: 'no-store' });
        if (meRes.ok) {
          const meJson = await meRes.json();
          setMe(meJson);
        }
      } catch {}
    })();
  }, []);

  async function load(u?: string) {
    const v = (u ?? targetUser).trim();
    if (!v) return;
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({
        user_name: v,
        ...(me?.email ? { viewer_name: me.email } : {})
      }).toString();

      const res = await fetch(`/api/leaves/available?${qs}`, { cache: 'no-store' });
      const body = res.ok ? await res.json().catch(() => null) : null;
      if (!body || !Array.isArray(body?.LeaveApprovalData)) {
        throw new Error(body?.error || 'Failed to load available leaves');
      }
      setData(body as AvailableResponse);
    } catch (e: any) {
      setError(e?.message || 'Failed to load available leaves');
      setData(null);
    } finally {
      setLoading(false);
    }
  }



  async function loadCompanyPolicy() {
  setPolicyLoading(true);
  setPolicyError(null);
  try {
    const res = await fetch('/api/hr/leave-policies', { cache: 'no-store' });
    const json = res.ok ? await res.json().catch(() => null) : null;
    if (!json || !json.success) throw new Error(json?.error || 'Failed to load company policy');
    setPolicy(
      json.data
        ? {
            total_paid_leave: json.data.total_paid_leave ?? null,
            total_sick_leave: json.data.total_sick_leave ?? null,
            accrual: json.data.accrual ?? null,
            carryover_paid: json.data.carryover_paid ?? null,
            carryover_sick: json.data.carryover_sick ?? null
          }
        : null
    );
  } catch (e: any) {
    setPolicy(null);
    setPolicyError(e?.message || 'Failed to load company policy');
  } finally {
    setPolicyLoading(false);
  }
}

useEffect(() => {
  (async () => {
    try {
      const meRes = await fetch('/api/auth/me', { cache: 'no-store' });
      if (meRes.ok) {
        const meJson = await meRes.json();
        setMe(meJson);
      }
    } finally {
      loadCompanyPolicy(); // fetch policy once HR context is known
    }
  })();
}, []);

  useEffect(() => {
    if (userFromQuery) {
      setTargetUser(userFromQuery);
      load(userFromQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userFromQuery]);

  // Friendly display for header
  const display = useMemo(() => {
    const email = (data?.user || targetUser || '').trim();
    if (!email) return '';
    const localPart = email.includes('@') ? email.split('@')[0] : email;
    return `${localPart} ${email.includes('@') ? email : ''}`.trim();
  }, [data?.user, targetUser]);

  // Fetch suggestions (company-scoped by viewer)
  const requestSuggestions = (q: string) => {
    if (!me?.email || !q.trim()) {
      setSuggestions([]);
      setShowSuggest(false);
      return;
    }
    const params = new URLSearchParams({ q, viewer_name: me.email });
    fetch(`/api/users/search?${params.toString()}`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.items) {
          setSuggestions(json.items as SuggestItem[]);
          setShowSuggest(true);
          setHighlight(-1);
        } else {
          setSuggestions([]);
          setShowSuggest(false);
        }
      })
      .catch(() => {
        setSuggestions([]);
        setShowSuggest(false);
      });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50 to-indigo-50 p-4 md:p-6 pb-24">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-3">Employee Leave Viewer</h1>
            <p className="text-gray-600 mt-1 text-sm md:text-base">View balances and history for any employee (same company).</p>
          </div>
          <Badge variant="secondary" className="text-sm px-4 py-2 w-fit">HR Portal</Badge>
        </div>

        <Card className="shadow-md border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Select Employee
            </CardTitle>
            <CardDescription>Type employee email or name, press Enter or click Load. Use “My leaves” for yourself.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative flex items-center gap-2">
              <input
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g. name@company.com"
                value={targetUser}
                onChange={(e) => {
                  const v = e.target.value;
                  setTargetUser(v);
                  setShowSuggest(!!v);
                  if (debounceRef.current) clearTimeout(debounceRef.current);
                  debounceRef.current = setTimeout(() => requestSuggestions(v), 250);
                }}
                onFocus={() => {
                  if (targetUser) {
                    setShowSuggest(true);
                    requestSuggestions(targetUser);
                  }
                }}
                onBlur={() => {
                  // delay hiding so click selection can fire
                  setTimeout(() => setShowSuggest(false), 120);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (showSuggest && highlight >= 0 && highlight < suggestions.length) {
                      const s = suggestions[highlight];
                      const pick = s.email || s.fullName || s.name;
                      setTargetUser(pick);
                      setShowSuggest(false);
                      load(pick);
                    } else {
                      load();
                    }
                  } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    if (!showSuggest || suggestions.length === 0) return;
                    setHighlight((h) => Math.min(h + 1, suggestions.length - 1));
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    if (!showSuggest || suggestions.length === 0) return;
                    setHighlight((h) => Math.max(h - 1, 0));
                  } else if (e.key === 'Escape') {
                    setShowSuggest(false);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => load()}
                className="rounded-md bg-primary px-4 py-2 text-white text-sm hover:opacity-90"
              >
                Load
              </button>
              {me?.email && (
                <button
                  type="button"
                  onClick={() => {
                    setTargetUser(me.email!);
                    setShowSuggest(false);
                    load(me.email!);
                  }}
                  className="rounded-md bg-slate-600 px-4 py-2 text-white text-sm hover:opacity-90 whitespace-nowrap"
                >
                  My leaves
                </button>
              )}

              {showSuggest && suggestions.length > 0 && (
                <div className="absolute z-50 left-0 right-0 top-[100%] mt-1 rounded-md border border-slate-200 bg-white shadow-lg">
                  <ul className="max-h-72 overflow-auto py-1 text-sm">
                    {suggestions.map((s, idx) => {
                      const primary = s.fullName || s.name || s.email;
                      const secondary = s.email && s.email !== primary ? s.email : '';
                      const isActive = idx === highlight;
                      return (
                        <li
                          key={`${s.email}-${idx}`}
                          className={`px-3 py-2 cursor-pointer ${isActive ? 'bg-primary/10' : 'hover:bg-slate-50'}`}
                          onMouseEnter={() => setHighlight(idx)}
                          onMouseDown={(e) => {
                            e.preventDefault(); // prevent input blur before click
                            const pick = s.email || s.fullName || s.name;
                            setTargetUser(pick);
                            setShowSuggest(false);
                            load(pick);
                          }}
                        >
                          <div className="font-medium text-slate-900">{primary}</div>
                          {!!secondary && <div className="text-slate-500">{secondary}</div>}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
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

        {/* {data && (
          <Card className="shadow-sm border-0 bg-white/70 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Viewing</CardTitle>
              <CardDescription>
                Employee: <span className="font-medium text-gray-900">{display || 'Unknown'}</span>
                {data.company ? ` • Company: ${data.company}` : ''}
                {' • '}
                Policy — Paid: {data.totals.totalPaidLeave} • Sick: {data.totals.totalSickLeave}
              </CardDescription>
            </CardHeader>
          </Card>
        )} */}

       {(policyLoading || policyError || policy !== null) && (
  <Card className="shadow-sm border-0 bg-white">
    <CardHeader className="pb-2">
      <CardTitle className="text-base text-slate-900">Company Leave Policy</CardTitle>
      <CardDescription className="text-slate-600">
        {policyLoading && 'Loading company policy...'}
        {!policyLoading && policyError && <span className="text-red-600">{policyError}</span>}
        {!policyLoading && !policyError && policy === null && (
          <span className="text-amber-600">
            No policy found yet. Create one in HR → Leaves → Company Leave Policies.
          </span>
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
                Leave balances are applied per company policy. Accrual and carryover behavior depends on the settings above.
              </span>
            </p>
          </div>
        </div>
      )}
    </CardContent>
  </Card>
)}

        {data && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.8fr,1fr]">
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
          </div>
        )}

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
                  config={{ Used: { label: 'Used', color: '#5ea3f2' }, Remaining: { label: 'Remaining', color: '#125ca5' } }}
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
                  config={{ Used: { label: 'Used', color: '#f39c9c' }, Remaining: { label: 'Remaining', color: '#c0392b' } }}
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
              <CardTitle className="flex items-center gap-2">All Leaves for Employee</CardTitle>
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