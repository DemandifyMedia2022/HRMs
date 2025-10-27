'use client';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Search,
  History,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Building2,
  Mail,
  Hash,
  Calendar,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { SidebarConfig } from '@/components/sidebar-config';

type Row = {
  id: number;
  name: string | null;
  full_name: string | null;
  email: string | null;
  emp_code: string | null;
  job_role: string | null;
  department: string | null;
  employment_status: string | null;
  company_name: string | null;
  joining_date: string | null;
  date_of_resignation: string | null;
  expected_last_working_day: string | null;
  date_of_relieving: string | null;
  resignation_reason_employee: string | null;
  resignation_reason_approver: string | null;
  settelment_employee_other_status: string | null;
  employee_other_status_remarks: string | null;
};

export default function Page() {
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Row | null>(null);
  const [reinstateLoading, setReinstateLoading] = useState(false);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (search) p.set('search', search);
    p.set('page', String(page));
    p.set('pageSize', String(pageSize));
    return p.toString();
  }, [search, page, pageSize]);

  useEffect(() => {
    let aborted = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/hr/settlement/history?${qs}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || 'Failed to load');
        if (!aborted) {
          setRows(json.data || []);
          setTotalPages(json.pagination?.totalPages || 1);
        }
      } catch (e: any) {
        if (!aborted) setError(typeof e?.message === 'string' ? e.message : 'Error');
      } finally {
        if (!aborted) setLoading(false);
      }
    }
    run();
    return () => {
      aborted = true;
    };
  }, [qs]);

  function fmt(d: string | null) {
    if (!d) return '';
    try {
      const dd = new Date(d);
      if (isNaN(dd.getTime())) return d;
      return dd.toLocaleDateString();
    } catch {
      return d;
    }
  }

  function initials(n?: string | null) {
    const s = (n || '').trim();
    if (!s) return '';
    const parts = s.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] || '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + last).toUpperCase();
  }

  async function reinstateEmployee() {
    if (!selected) return;
    try {
      setReinstateLoading(true);
      const res = await fetch('/api/hr/settlement/reinstate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selected.id })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Failed to reinstate');
      setSelected(null);
      // refresh list
      const res2 = await fetch(`/api/hr/settlement/history?${qs}`);
      const json2 = await res2.json();
      if (res2.ok) {
        setRows(json2.data || []);
        setTotalPages(json2.pagination?.totalPages || 1);
      }
    } catch (e: any) {
      setError(typeof e?.message === 'string' ? e.message : 'Failed to reinstate');
    } finally {
      setReinstateLoading(false);
    }
  }

  return (
    <>
      <SidebarConfig role="hr" />
      <div className="min-h-screen  p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-3">Settlement History</h1>
              <p className="text-gray-600 mt-1">View archived employee records and reinstate if needed</p>
            </div>
            <Badge variant="secondary" className="text-sm px-4 py-2">
              {rows.length} Records
            </Badge>
          </div>

          {/* Search & Filter Section */}
          <Card className="shadow-lg border-0">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={search}
                    onChange={e => {
                      setPage(1);
                      setSearch(e.target.value);
                    }}
                    placeholder="Search by name, email, or employee code..."
                    className="pl-10 h-12"
                  />
                </div>
                <div className="w-[140px]">
                  <Select
                    value={String(pageSize)}
                    onValueChange={v => {
                      setPage(1);
                      setPageSize(Number(v));
                    }}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Per page" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 per page</SelectItem>
                      <SelectItem value="20">20 per page</SelectItem>
                      <SelectItem value="50">50 per page</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">{error}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Employee History Cards */}
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                Archived Employees
              </CardTitle>
              <CardDescription>Click on an employee to view details and reinstate</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="text-gray-600 mt-4">Loading history...</p>
                  </div>
                </div>
              ) : rows.length === 0 ? (
                <div className="text-center py-12">
                  <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No archived employees found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {rows.map(r => {
                      const displayName = r.full_name || r.name || '';
                      return (
                        <Card
                          key={r.id}
                          className="hover:shadow-xl hover:-translate-y-1 transition-all duration-200 hover:border-primary cursor-pointer"
                        >
                          <button className="w-full text-left" onClick={() => setSelected(r)}>
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <Avatar className="w-12 h-12 ring-2 ring-primary">
                                  <AvatarFallback className="bg-primary text-white font-semibold">
                                    {initials(displayName)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-gray-900 truncate">{displayName || 'Unnamed'}</div>
                                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                    <Badge variant="outline" className="text-[10px] px-2">
                                      <Hash className="w-3 h-3 mr-1" />
                                      {r.emp_code || 'N/A'}
                                    </Badge>
                                  </div>
                                  {r.department && (
                                    <Badge variant="secondary" className="text-[10px] mt-2">
                                      <Building2 className="w-3 h-3 mr-1" />
                                      {r.department}
                                    </Badge>
                                  )}
                                  {r.date_of_relieving && (
                                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                                      <Calendar className="w-3 h-3" />
                                      <span>{fmt(r.date_of_relieving)}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </button>
                        </Card>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page <= 1 || loading}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>
                    <div className="text-sm text-gray-600">
                      Page <span className="font-semibold">{page}</span> of{' '}
                      <span className="font-semibold">{totalPages}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages || loading}
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Dialog
            open={!!selected}
            onOpenChange={o => {
              if (!o) setSelected(null);
            }}
          >
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-primary-600" />
                  Employee Settlement Details
                </DialogTitle>
              </DialogHeader>
              {selected && (
                <div className="space-y-6">
                  <div className="flex items-start gap-4 p-4 bg-primary-50 rounded-lg">
                    <Avatar className="w-16 h-16 ring-2 ring-primary-200">
                      <AvatarFallback className="bg-primary text-white font-semibold text-lg">
                        {initials(selected.full_name || selected.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="text-lg font-semibold text-gray-900">
                        {selected.full_name || selected.name || 'Unnamed'}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {selected.company_name && (
                          <Badge variant="secondary" className="text-xs">
                            <Building2 className="w-3 h-3 mr-1" />
                            {selected.company_name}
                          </Badge>
                        )}
                        {selected.job_role && (
                          <Badge variant="outline" className="text-xs">
                            {selected.job_role}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                        <Label className="text-xs text-gray-500 font-medium">Joining Date</Label>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium">{selected.joining_date || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                        <Label className="text-xs text-gray-500 font-medium">Date of Resignation</Label>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium">{fmt(selected.date_of_resignation) || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                        <Label className="text-xs text-gray-500 font-medium">Expected Last Working Day</Label>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium">
                            {fmt(selected.expected_last_working_day) || 'N/A'}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                        <Label className="text-xs text-gray-500 font-medium">Date of Relieving</Label>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium">{fmt(selected.date_of_relieving) || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                        <Label className="text-xs text-gray-500 font-medium">Resignation Reason (Employee)</Label>
                        <p className="text-sm break-words">{selected.resignation_reason_employee || 'N/A'}</p>
                      </div>
                      <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                        <Label className="text-xs text-gray-500 font-medium">Resignation Reason (Approver)</Label>
                        <p className="text-sm break-words">{selected.resignation_reason_approver || 'N/A'}</p>
                      </div>
                      <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                        <Label className="text-xs text-gray-500 font-medium">Employee Other Status</Label>
                        <p className="text-sm break-words">{selected.settelment_employee_other_status || 'N/A'}</p>
                      </div>
                      <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                        <Label className="text-xs text-gray-500 font-medium">Employee Other Status Remarks</Label>
                        <p className="text-sm break-words">{selected.employee_other_status_remarks || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={() => setSelected(null)}>
                      Close
                    </Button>
                    <Button
                      onClick={reinstateEmployee}
                      disabled={reinstateLoading}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${reinstateLoading ? 'animate-spin' : ''}`} />
                      {reinstateLoading ? 'Reinstating...' : 'Reinstate Employee'}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </>
  );
}
