'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Search,
  Users,
  Archive,
  ChevronLeft,
  ChevronRight,
  Building2,
  Mail,
  Hash,
  Briefcase,
  AlertCircle,
  UserX
} from 'lucide-react';
import { SidebarConfig } from '@/components/sidebar-config';

type UserRow = {
  id: number;
  name: string | null;
  Full_name: string | null;
  email: string | null;
  emp_code: string | null;
  department: string | null;
  employment_status: string | null;
  company_name: string | null;
};

type PageResp = {
  data: UserRow[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};

export default function HREmployeeSettlementPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<UserRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [openId, setOpenId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    date_of_resignation: '',
    expected_last_working_day: '',
    date_of_relieving: '',
    resignation_reason_employee: '',
    resignation_reason_approver: '',
    employment_status: '',
    employee_other_status: '',
    employee_other_status_remarks: ''
  });

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      params.set('page', String(page));
      params.set('pageSize', '10');
      const res = await fetch(`/api/hr/settlement/users?${params.toString()}`, { cache: 'no-store' });
      const json = (await res.json()) as PageResp | any;
      if (!res.ok) throw new Error(json?.error || 'Failed to load users');
      setData((json as PageResp).data);
      setTotalPages((json as PageResp).pagination.totalPages);
    } catch (e: any) {
      setError(e?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function openArchive(u: UserRow) {
    setOpenId(u.id);
    setForm({
      date_of_resignation: '',
      expected_last_working_day: '',
      date_of_relieving: '',
      resignation_reason_employee: '',
      resignation_reason_approver: '',
      employment_status: u.employment_status || 'Resigned',
      employee_other_status: '',
      employee_other_status_remarks: ''
    });
  }

  async function submitArchive(id: number) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/hr/settlement/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...form })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Failed to archive user');
      setOpenId(null);
      await load();
    } catch (e: any) {
      setError(e?.message || 'Failed to archive user');
    } finally {
      setSubmitting(false);
    }
  }

  function getInitials(u: UserRow) {
    const n = (u.Full_name || u.name || '').trim();
    if (!n) return '--';
    const parts = n.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] || '';
    const second = parts[1]?.[0] || '';
    return (first + second).toUpperCase() || first.toUpperCase() || '--';
  }

  return (
    <>
      <SidebarConfig role="hr" />
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-3">Employee Settlement</h1>
              <p className="text-gray-600 mt-1">Manage employee resignations and archival</p>
            </div>
            <Badge variant="secondary" className="text-sm px-4 py-2">
              {data.length} Employees
            </Badge>
          </div>

          {/* Search Section */}
          <Card className="shadow-lg border-0">
            <CardContent className="pt-6">
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <Label className="text-sm font-medium mb-2 block">Search Employees</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search by name, email, or employee code..."
                      className="pl-10 h-12"
                    />
                  </div>
                </div>
                <Button
                  onClick={() => {
                    setPage(1);
                    load();
                  }}
                  className="h-12"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
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

          {/* Employee List */}
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Employees for Settlement
              </CardTitle>
              <CardDescription>Select an employee to archive their records</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="text-gray-600 mt-4">Loading employees...</p>
                  </div>
                </div>
              ) : data.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No employees found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.map(u => (
                      <Card
                        key={u.id}
                        className="hover:shadow-xl hover:-translate-y-1 transition-all duration-200 hover:border-primary"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Avatar className="w-12 h-12 ring-2 ring-primary">
                              <AvatarFallback className="bg-primary text-white font-semibold">
                                {getInitials(u)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-900 truncate">
                                {u.Full_name || u.name || 'Unnamed'}
                              </div>
                              <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                <Mail className="w-3 h-3" />
                                <span className="truncate">{u.email || 'N/A'}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <Badge variant="outline" className="text-[10px] px-2">
                                  <Hash className="w-3 h-3 mr-1" />
                                  {u.emp_code || 'N/A'}
                                </Badge>
                                {u.department && (
                                  <Badge variant="secondary" className="text-[10px]">
                                    <Building2 className="w-3 h-3 mr-1" />
                                    {u.department}
                                  </Badge>
                                )}
                              </div>
                              {u.employment_status && (
                                <Badge className="mt-2 text-[10px] bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                                  {u.employment_status}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openArchive(u)}
                            className="w-full mt-3 border-primary hover:bg-primary hover:text-white"
                          >
                            <Archive className="w-4 h-4 mr-2" />
                            Archive Employee
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
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
                      disabled={page >= totalPages}
                      onClick={() => setPage(p => p + 1)}
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
            open={openId !== null}
            onOpenChange={o => {
              if (!o) setOpenId(null);
            }}
          >
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Archive className="w-5 h-5 text-primary" />
                  Archive Employee {openId !== null ? `#${openId}` : ''}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date_of_resignation" className="text-sm font-medium">
                      Date of Resignation
                    </Label>
                    <Input
                      id="date_of_resignation"
                      type="date"
                      value={form.date_of_resignation}
                      onChange={e => setForm({ ...form, date_of_resignation: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expected_last_working_day" className="text-sm font-medium">
                      Expected Last Working Day
                    </Label>
                    <Input
                      id="expected_last_working_day"
                      type="date"
                      value={form.expected_last_working_day}
                      onChange={e => setForm({ ...form, expected_last_working_day: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date_of_relieving" className="text-sm font-medium">
                      Date of Relieving
                    </Label>
                    <Input
                      id="date_of_relieving"
                      type="date"
                      value={form.date_of_relieving}
                      onChange={e => setForm({ ...form, date_of_relieving: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employment_status" className="text-sm font-medium">
                      Employment Status
                    </Label>
                    <Input
                      id="employment_status"
                      value={form.employment_status}
                      onChange={e => setForm({ ...form, employment_status: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="resignation_reason_employee" className="text-sm font-medium">
                      Resignation Reason (Employee)
                    </Label>
                    <Input
                      id="resignation_reason_employee"
                      value={form.resignation_reason_employee}
                      onChange={e => setForm({ ...form, resignation_reason_employee: e.target.value })}
                      placeholder="Enter employee's resignation reason"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="resignation_reason_approver" className="text-sm font-medium">
                      Resignation Reason (Approver)
                    </Label>
                    <Input
                      id="resignation_reason_approver"
                      value={form.resignation_reason_approver}
                      onChange={e => setForm({ ...form, resignation_reason_approver: e.target.value })}
                      placeholder="Enter approver's notes"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employee_other_status" className="text-sm font-medium">
                      Other Status
                    </Label>
                    <Input
                      id="employee_other_status"
                      value={form.employee_other_status}
                      onChange={e => setForm({ ...form, employee_other_status: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employee_other_status_remarks" className="text-sm font-medium">
                      Other Status Remarks
                    </Label>
                    <Input
                      id="employee_other_status_remarks"
                      value={form.employee_other_status_remarks}
                      onChange={e => setForm({ ...form, employee_other_status_remarks: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button variant="outline" onClick={() => setOpenId(null)}>
                  Cancel
                </Button>
                <Button
                  disabled={submitting}
                  onClick={() => openId !== null && submitArchive(openId)}
                  className="bg-primary hover:bg-primary"
                >
                  <Archive className="w-4 h-4 mr-2" />
                  {submitting ? 'Archiving...' : 'Confirm Archive'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </>
  );
}
