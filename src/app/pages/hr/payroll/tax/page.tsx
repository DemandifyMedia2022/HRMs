'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { SidebarConfig } from '@/components/sidebar-config';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  IconSearch,
  IconX,
  IconEye,
  IconFileText,
  IconCalendar,
  IconShieldCheck,
  IconChartBar,
  IconCalculator,
  IconSettings
} from '@tabler/icons-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, AreaChart, Area } from 'recharts';

type TaxRow = {
  // Common list fields (as in Laravel blade)
  user_id?: string | number;
  id?: string | number;
  Full_name?: string;
  emp_code?: string;
  // Keep the object open to allow arbitrary API columns
  [key: string]: any;
};

function SlabsCharts({ slabData }: { slabData: any[] }) {
  const data = useMemo(() => {
    const cat = Array.isArray(slabData) ? slabData.find(c => c?.category === 'individual') : null;
    const slabs: any[] = cat?.slabs || [];
    if (!slabs.length) return [] as Array<{ band: string; Old: number; New: number }>;

    const fmtBand = (lo: number, hi: number) => {
      const L = (n: number) => (n >= 10000000 ? `${(n / 10000000).toFixed(1)}Cr` : `${Math.round(n / 100000)}L`);
      const cap = hi > 90000000 ? '∞' : L(hi);
      return `${L(lo)} - ${cap}`;
    };

    const bandsMap = new Map<string, { Old: number; New: number }>();
    for (const s of slabs) {
      const band = fmtBand(Number(s.lower_limit || 0), Number(s.upper_limit || 0));
      const regime = String(s.tax_regime || '').toUpperCase() as 'OLD' | 'NEW';
      const rate = Number(s.tax_percentage || 0);
      const entry = bandsMap.get(band) || { Old: 0, New: 0 };
      if (regime === 'OLD') entry.Old = rate;
      if (regime === 'NEW') entry.New = rate;
      bandsMap.set(band, entry);
    }
    return Array.from(bandsMap.entries()).map(([band, v]) => ({ band, ...v }));
  }, [slabData]);

  if (!data.length) {
    return <div className="text-sm text-muted-foreground">No slab data available</div>;
  }

  return (
    <ChartContainer
      config={{
        Old: { label: 'Old Regime', color: 'var(--chart-5)' },
        New: { label: 'New Regime', color: 'var(--chart-1)' }
      }}
      className="w-full"
    >
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ left: 12, right: 12, top: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="band" tick={{ fontSize: 10 }} interval={0} height={50} />
          <YAxis unit="%" />
          <Bar dataKey="Old" fill="var(--color-Old)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="New" fill="var(--color-New)" radius={[4, 4, 0, 0]} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

function ProfessionalTaxChart({ data }: { data: any | null }) {
  const months = ['apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar'];
  const monthLabels = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

  const dataset = useMemo(() => {
    if (!data) return [] as Array<{ month: string; amount: number }>;
    return months.map((m, i) => {
      // Sum monthly contributions across available slabs 1..5
      const val = [1, 2, 3, 4, 5].reduce((sum, idx) => {
        const key = `${m}${idx}` as keyof typeof data;
        const v = Number.parseFloat(String((data as any)[key] ?? '0')) || 0;
        return sum + v;
      }, 0);
      return { month: monthLabels[i], amount: val };
    });
  }, [data]);

  if (!dataset.length) return <div className="text-sm text-muted-foreground">No professional tax data</div>;

  return (
    <ChartContainer config={{ amount: { label: 'PT Amount', color: 'var(--primary)' } }} className="w-full">
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={dataset} margin={{ left: 12, right: 12, top: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="ptArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.35} />
              <stop offset="95%" stopColor="var(--color-amount)" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12 }}
            interval={0}
            minTickGap={8}
            tickLine={false}
            axisLine={false}
          />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
          <Area type="monotone" dataKey="amount" stroke="var(--color-amount)" fill="url(#ptArea)" />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

export default function Page() {
  const [rows, setRows] = useState<TaxRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [slabData, setSlabData] = useState<any[]>([]);
  const [ptData, setPtData] = useState<any | null>(null);

  const fetchRows = async (query?: string) => {
    try {
      setLoading(true);
      const url =
        query && query.length > 0
          ? `/api/payroll/tax-structure?search=${encodeURIComponent(query)}`
          : '/api/payroll/tax-structure';
      const res = await fetch(url, { cache: 'no-store' });
      const json = await res.json();
      if (json.success) setRows(json.data as TaxRow[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/payroll/tax-slabs-details', { cache: 'no-store', credentials: 'include' });
        const j = await res.json();
        if (j?.success && Array.isArray(j.data)) setSlabData(j.data);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const ts = Date.now();
        const res = await fetch(`/api/payroll/professional-tax-slabs?_t=${ts}`, {
          cache: 'no-store',
          credentials: 'include'
        });
        const j = await res.json();
        if (j?.success && j.data) setPtData(j.data);
      } catch {}
    })();
  }, []);

  const [selected, setSelected] = useState<TaxRow | null>(null);

  return (
    <>
      <SidebarConfig role="hr" />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Expense Management</h1>
            <p className="text-muted-foreground">View and manage employee tax details and structures</p>
          </div>
        </div>

        {/* Quick Nav (simple buttons) */}
        <Card className="border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg">Quick Navigation</CardTitle>
            <CardDescription>Access payroll management tools</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              <Button variant="outline" size="sm" asChild className="justify-start gap-2">
                <Link href="/pages/hr/payroll/tax/process-attendance">
                  <IconCalendar className="h-4 w-5" /> Process Attendance
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="justify-start gap-2">
                <Link href="/pages/hr/payroll/statutory">
                  <IconShieldCheck className="h-4 w-4" /> Statutory
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="justify-start gap-2">
                <Link href="/pages/hr/payroll/tax-slabs">
                  <IconChartBar className="h-4 w-4" /> Tax Slabs
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="justify-start gap-2">
                <Link href="/pages/hr/payroll/tax-estimator">
                  <IconCalculator className="h-4 w-4" /> Tax Estimator
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="justify-start gap-2">
                <Link href="/pages/hr/payroll/tax/update">
                  <IconSettings className="h-4 w-4" /> Tax Structure
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tax Slabs Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tax Slabs & Professional Tax Overview</CardTitle>
            <CardDescription>Income tax (Old vs New) and monthly PT contributions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SlabsCharts slabData={slabData} />
              <ProfessionalTaxChart data={ptData} />
            </div>
          </CardContent>
        </Card>

        {/* Search & Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-xl">Employee Tax Records</CardTitle>
                <CardDescription className="mt-1">
                  {rows.length} employee{rows.length !== 1 ? 's' : ''} found
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={q}
                    onChange={e => setQ(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && fetchRows(q)}
                    placeholder="Search by name, code, or ID..."
                    className="pl-9 w-64"
                  />
                </div>
                <Button onClick={() => fetchRows(q)} size="sm">
                  <IconSearch className="h-4 w-4 mr-1" />
                  Search
                </Button>
                <Button
                  onClick={() => {
                    setQ('');
                    fetchRows('');
                  }}
                  variant="outline"
                  size="sm"
                >
                  <IconX className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-12 text-center text-muted-foreground">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                <div>Loading tax structure...</div>
              </div>
            ) : rows.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <IconFileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <div className="font-medium">No records found</div>
                <div className="text-sm">Try adjusting your search criteria</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-left">ID</TableHead>
                      <TableHead className="text-left">Name</TableHead>
                      <TableHead className="text-left">Employee Code</TableHead>
                      <TableHead className="text-left">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row: TaxRow, idx: number) => (
                      <TableRow key={`${row.user_id ?? row.id ?? row.emp_code ?? idx}`}>
                        <TableCell className="font-medium text-primary">
                          {String(row.user_id ?? row.id ?? '')}
                        </TableCell>
                        <TableCell className="font-medium">{row.Full_name ?? row.name ?? ''}</TableCell>
                        <TableCell className="text-muted-foreground">{row.emp_code ?? ''}</TableCell>
                        <TableCell>
                          <Button onClick={() => setSelected(row)} variant="outline" size="sm">
                            <IconEye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Details Dialog */}
      <Dialog
        open={!!selected}
        onOpenChange={o => {
          if (!o) setSelected(null);
        }}
      >
        <DialogContent className="sm:max-w-3xl p-0">
          <Card className="border-0 shadow-none">
            <CardHeader className="sticky top-0 bg-background z-10 border-b">
              <DialogHeader>
                <DialogTitle>Tax Details</DialogTitle>
              </DialogHeader>
            </CardHeader>
            <CardContent className="max-h-[70vh] overflow-y-auto">
              <div className="space-y-3">
                {selected &&
                  Object.entries(selected).map(([k, v]) => (
                    <div key={k} className="grid grid-cols-2 gap-4 py-3 border-b">
                      <div className="font-semibold text-sm text-muted-foreground capitalize">
                        {k.replace(/_/g, ' ')}
                      </div>
                      <div className="text-sm font-medium break-words">{String(v ?? '—')}</div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    </>
  );
}
