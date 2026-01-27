'use client';

import { useMemo, useState, useEffect } from 'react';
import { SidebarConfig } from '@/components/sidebar-config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';
import { Search, Download, Eye, Edit, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from '@/components/ui/chart';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

interface ProcessAttendanceData {
  id: number;
  Full_name: string;
  emp_code: string;
  company_name: string;
  job_role: string;
  pay_days: number;
  net_pay: number;
  arrear_days: number;
}

function OverviewPie({ data, month }: { data: ProcessAttendanceData[]; month: string }) {
  const { totalNet, totalDeduction, avgPerEmployee } = useMemo(() => {
    const totalNet = data.reduce((s, d) => s + (d.net_pay || 0), 0);
    const daysInMonth = (() => {
      const [y, m] = month.split('-').map(Number);
      return new Date(y, m, 0).getDate();
    })();
    const estDeductions = data.reduce((sum, d) => {
      const paid = Math.max(1, Number(d.pay_days || 0));
      const perDay = Number(d.net_pay || 0) / paid;
      const unpaid = Math.max(0, daysInMonth - paid);
      return sum + perDay * unpaid;
    }, 0);
    const avgPerEmployee = data.length ? Math.round(totalNet / data.length) : 0;
    return { totalNet, totalDeduction: Math.max(0, Math.round(estDeductions)), avgPerEmployee };
  }, [data, month]);

  const colors = ['var(--chart-1)', 'var(--chart-5)'];
  const dataset = [
    { name: 'Net Salary', value: totalNet },
    { name: 'Est. Deductions (Leaves)', value: totalDeduction }
  ];

  return (
    <ChartContainer config={{ value: { label: 'Amount', color: colors[0] } }}>
      <div className="w-full">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={dataset} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
              {dataset.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
            </Pie>
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-2 text-sm text-muted-foreground">
          Avg per employee: ₹{avgPerEmployee.toLocaleString('en-IN')}
        </div>
      </div>
    </ChartContainer>
  );
}

function SalaryTrend({ trend }: { trend: { label: string; total: number }[] }) {
  if (!trend.length) return null;
  return (
    <ChartContainer config={{ total: { label: 'Total Net', color: 'var(--primary)' } }}>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={trend} margin={{ left: 12, right: 12, top: 8 }}>
          <defs>
            <linearGradient id="salTrend" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.35} />
              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tickFormatter={v => v.split('-').reverse().join('/')}
            interval={0}
            minTickGap={8}
            tickLine={false}
            axisLine={false}
          />
          <YAxis tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} tickLine={false} axisLine={false} />
          <Area type="monotone" dataKey="total" stroke="var(--primary)" fill="url(#salTrend)" />
          <ChartTooltip content={<ChartTooltipContent />} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

export default function ProcessAttendancePage() {
  const [data, setData] = useState<ProcessAttendanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [trend, setTrend] = useState<{ label: string; total: number }[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10
  });

  const fetchData = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        month,
        ...(search && { search })
      });

      const response = await fetch(`/api/payroll/process-attendance?${params}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
        setPagination(result.pagination);
      } else {
        console.error('Failed to fetch data:', result.error);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(pagination.currentPage);
  }, []);

  useEffect(() => {
    // fetch last 6 months totals for trend chart
    (async () => {
      try {
        const base = new Date(`${month}-01`);
        const months: string[] = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(base);
          d.setMonth(d.getMonth() - i);
          const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          months.push(m);
        }
        const results = await Promise.all(
          months.map(async m => {
            const params = new URLSearchParams({ page: '1', month: m });
            const res = await fetch(`/api/payroll/process-attendance?${params}`, { cache: 'no-store' });
            const json = await res.json();
            const total = json?.success
              ? (json.data as ProcessAttendanceData[]).reduce((s: number, d: any) => s + (d.net_pay || 0), 0)
              : 0;
            return { label: m, total };
          })
        );
        setTrend(results);
      } catch {
        setTrend([]);
      }
    })();
  }, [month]);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData(1);
  };

  const handleDownloadCSV = () => {
    const params = new URLSearchParams({
      month,
      ...(search && { search }),
      download: 'csv'
    });
    window.location.href = `/api/payroll/process-attendance?${params}`;
  };

  return (
    <>
      <SidebarConfig role="hr" />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Process Attendance</h1>
          <Button asChild variant="outline">
            <Link href="/pages/hr/payroll/tax">Back</Link>
          </Button>
        </div>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-md border p-3">
                <div className="text-sm text-muted-foreground">Employees</div>
                <div className="text-2xl font-semibold">{pagination.totalCount}</div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-sm text-muted-foreground">Total Net Pay</div>
                <div className="text-2xl font-semibold">
                  ₹{data.reduce((s, d) => s + (d.net_pay || 0), 0).toLocaleString('en-IN')}
                </div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-sm text-muted-foreground">Avg Paid Days</div>
                <div className="text-2xl font-semibold">
                  {data.length ? Math.round(data.reduce((s, d) => s + (d.pay_days || 0), 0) / data.length) : 0}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <OverviewPie data={data} month={month} />
              <SalaryTrend trend={trend} />
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleFilter}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="month">Select Month</Label>
                  <Input
                    type="month"
                    id="month"
                    value={month}
                    onChange={e => setMonth(e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="search">Search Employee</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      id="search"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Name or Code..."
                      className="pl-10 w-full"
                    />
                  </div>
                </div>

                <div className="flex items-end">
                  <Button type="submit" className="w-full">
                    <Search className="mr-2 h-4 w-4" />
                    Filter
                  </Button>
                </div>

                <div className="flex items-end">
                  <Button type="button" onClick={handleDownloadCSV} variant="outline" className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Download CSV
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading attendance data...</p>
                </div>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-center w-[60px]">#</TableHead>
                        <TableHead className="text-center">Name</TableHead>
                        <TableHead className="text-center">Emp Code</TableHead>
                        <TableHead className="text-center">Company</TableHead>
                        <TableHead className="text-center">Designation</TableHead>
                        <TableHead className="text-center">Paid Days</TableHead>
                        <TableHead className="text-center">Net Salary</TableHead>
                        <TableHead className="text-center">Arrears</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.length > 0 ? (
                        data.map((item, index) => (
                          <TableRow key={item.id}>
                            <TableCell className="text-center">
                              {(pagination.currentPage - 1) * pagination.limit + index + 1}
                            </TableCell>
                            <TableCell className="text-center font-medium">{item.Full_name}</TableCell>
                            <TableCell className="text-center">{item.emp_code}</TableCell>
                            <TableCell className="text-center">{item.company_name}</TableCell>
                            <TableCell className="text-center">{item.job_role}</TableCell>
                            <TableCell className="text-center text-blue-600 font-semibold">{item.pay_days}</TableCell>
                            <TableCell className="text-center text-green-600 font-semibold">
                              ₹{item.net_pay.toLocaleString('en-IN')}
                            </TableCell>
                            <TableCell className="text-center">{item.arrear_days}</TableCell>
                            <TableCell className="text-center">
                              <div className="flex gap-2 justify-center">
                                <Button
                                  asChild
                                  size="sm"
                                  variant="outline"
                                  className="h-8 w-8 p-0"
                                  title="View Annual Report"
                                >
                                  <Link href={`/pages/hr/payroll/salary-report/${item.emp_code}`}>
                                    <Eye className="h-4 w-4" />
                                  </Link>
                                </Button>
                                <Button
                                  asChild
                                  size="sm"
                                  variant="outline"
                                  className="h-8 w-8 p-0"
                                  title="Edit Attendance"
                                >
                                  <Link href={`/pages/hr/payroll/tax/edit-attendance/${item.emp_code}`}>
                                    <Edit className="h-4 w-4" />
                                  </Link>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={9} className="py-12 text-center text-muted-foreground">
                            No attendance data found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <Button
                      onClick={() => fetchData(pagination.currentPage - 1)}
                      disabled={pagination.currentPage === 1}
                      variant="outline"
                      size="sm"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <div className="px-4 py-2 bg-muted rounded-md text-sm font-medium">
                      Page {pagination.currentPage} of {pagination.totalPages}
                    </div>
                    <Button
                      onClick={() => fetchData(pagination.currentPage + 1)}
                      disabled={pagination.currentPage === pagination.totalPages}
                      variant="outline"
                      size="sm"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}

                <div className="mt-4 text-sm text-muted-foreground text-center">
                  Showing {data.length > 0 ? (pagination.currentPage - 1) * pagination.limit + 1 : 0} to{' '}
                  {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of{' '}
                  {pagination.totalCount} employees
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function ChartEmployees({ data }: { data: ProcessAttendanceData[] }) {
  const dataset = useMemo(() => {
    const top = [...data]
      .sort((a, b) => b.net_pay - a.net_pay)
      .slice(0, 8)
      .map(d => ({ name: d.Full_name, pay: d.net_pay }));

    return top;
  }, [data]);

  if (!dataset.length) return null;

  return (
    <div className="mt-2">
      <ChartContainer config={{ pay: { label: 'Net Pay', color: 'var(--chart-1)' } }} className="aspect-[3/1]">
        <ResponsiveContainer>
          <BarChart data={dataset} margin={{ left: 12, right: 12, top: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" hide interval={0} />
            <YAxis tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
            <Bar dataKey="pay" fill="var(--color-pay)" radius={[4, 4, 0, 0]} />
            <ChartTooltip content={<ChartTooltipContent nameKey="pay" />} />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
