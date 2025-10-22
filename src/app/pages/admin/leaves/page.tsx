'use client';

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import Link from 'next/link';
import { SidebarConfig } from '@/components/sidebar-config';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

type Leave = {
  l_id: number;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  HRapproval: string;
  HRrejectReason: string | null;
  Managerapproval: string;
  ManagerRejecjetReason: string | null;
  leaveregdate: string;
  added_by_user: string;
};

type ApiResponse = {
  data: Leave[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export default function HRLeavesPage() {
  const [leaveType, setLeaveType] = useState('');
  const [month, setMonth] = useState(''); // YYYY-MM
  const [userName, setUserName] = useState('');
  const [status, setStatus] = useState(''); // HRapproval

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<Leave[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<Leave | null>(null);
  const [userInfo, setUserInfo] = useState<any | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [decision, setDecision] = useState<'approved' | 'rejected' | ''>('');
  const [rejectReason, setRejectReason] = useState('');
  const [flash, setFlash] = useState<string | null>(null);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (leaveType) p.set('leave_type', leaveType);
    if (month) p.set('month', month);
    if (userName) p.set('user_name', userName);
    if (status) p.set('Leaves_Status', status);
    p.set('page', String(page));
    p.set('pageSize', String(pageSize));
    return p.toString();
  }, [leaveType, month, userName, status, page, pageSize]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/leaves?${qs}`, { cache: 'no-store' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || 'Failed to load leaves');
      }
      const data: ApiResponse = await res.json();
      setRows(data.data);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (e: any) {
      setError(e?.message || 'Failed to load leaves');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qs]);

  async function updateStatus(id: number, approve: boolean) {
    const payload: any = approve
      ? { id, HRapproval: 'approved', HRrejectReason: '' }
      : { id, HRapproval: 'rejected', HRrejectReason: 'Rejected by HR' };
    try {
      const res = await fetch(`/api/leaves`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || 'Failed to update status');
      }
      await load();
    } catch (e) {
      alert((e as any)?.message || 'Failed to update status');
    }
  }

  async function openReview(l: Leave) {
    setSelected(l);
    setDecision('');
    setRejectReason('');
    setUserInfo(null);
    try {
      setReviewLoading(true);
      const res = await fetch(
        `/api/hr/settlement/users?search=${encodeURIComponent(l.added_by_user)}&page=1&pageSize=1`,
        { cache: 'no-store' }
      );
      if (res.ok) {
        const j = await res.json();
        setUserInfo(j?.data?.[0] || null);
      }
    } catch {
    } finally {
      setReviewLoading(false);
    }
  }

  async function submitReview() {
    if (!selected || !decision) return;
    const payload: any =
      decision === 'approved'
        ? { id: selected.l_id, HRapproval: 'approved', HRrejectReason: '' }
        : { id: selected.l_id, HRapproval: 'rejected', HRrejectReason: rejectReason || 'Rejected by HR' };
    try {
      const res = await fetch(`/api/leaves`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || 'Failed to update status');
      }
      setSelected(null);
      await load();
      setFlash('Status updated successfully');
      setTimeout(() => setFlash(null), 3000);
    } catch (e: any) {
      alert(e?.message || 'Failed to update status');
    }
  }

  function resetFilters() {
    setLeaveType('');
    setMonth('');
    setUserName('');
    setStatus('');
    setPage(1);
  }

  const handleFiltersSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
  };

  const formatDate = (value?: string | null) => {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
  };

  const renderStatusBadge = (value?: string | null) => {
    const text = (value || 'Pending').toString();
    const lower = text.toLowerCase();
    const classes =
      lower === 'approved'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
        : lower === 'rejected'
          ? 'border-destructive/50 bg-destructive/10 text-destructive'
          : 'border-amber-200 bg-amber-50 text-amber-700';
    return (
      <Badge variant="outline" className={classes}>
        {text.charAt(0).toUpperCase() + text.slice(1)}
      </Badge>
    );
  };

  const selectStatusValue = status || 'all';

  return (
    <>
      <SidebarConfig role="admin" />
      <div className="p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          {flash ? (
            <div className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {flash}
            </div>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight">All Employees Leaves</h1>
              <p className="text-sm text-muted-foreground">Review, filter, and action company-wide leave requests.</p>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Filters</CardTitle>
              <CardDescription>Refine the leave list by type, period, requester, or HR status.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5" onSubmit={handleFiltersSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="leave_type">Leave Type</Label>
                  <Input
                    id="leave_type"
                    value={leaveType}
                    onChange={e => setLeaveType(e.target.value)}
                    placeholder="e.g. Sick"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filter_month">Month</Label>
                  <Input id="filter_month" type="month" value={month} onChange={e => setMonth(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user_name">User Name</Label>
                  <Input
                    id="user_name"
                    value={userName}
                    onChange={e => setUserName(e.target.value)}
                    placeholder="Search by employee"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hr_status">HR Status</Label>
                  <Select value={selectStatusValue} onValueChange={value => setStatus(value === 'all' ? '' : value)}>
                    <SelectTrigger id="hr_status">
                      <SelectValue placeholder="Any status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex min-w-0 flex-col items-end gap-2 sm:flex-row">
                  <Button type="submit" className="w-full sm:flex-1" disabled={loading}>
                    Apply
                  </Button>
                  <Button type="button" variant="outline" className="w-full sm:flex-1" onClick={resetFilters}>
                    Reset
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Leave Requests</CardTitle>
              <CardDescription>Total records: {total}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error ? (
                <div className="rounded border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              ) : null}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={`skeleton-${index}`}>
                        <TableCell colSpan={8}>
                          <Skeleton className="h-6 w-full rounded" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                        No leave requests match the current filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map(l => (
                      <TableRow key={l.l_id}>
                        <TableCell className="font-medium">{l.l_id}</TableCell>
                        <TableCell>{l.leave_type}</TableCell>
                        <TableCell>{formatDate(l.start_date)}</TableCell>
                        <TableCell>{formatDate(l.end_date)}</TableCell>
                        <TableCell className="flex flex-col gap-1">
                          <span className="font-medium">{l.added_by_user}</span>
                          <span className="text-xs text-muted-foreground">Submitted {formatDate(l.leaveregdate)}</span>
                        </TableCell>
                        <TableCell>{renderStatusBadge(l.Managerapproval)}</TableCell>
                        <TableCell className="max-w-[240px] whitespace-normal text-sm text-muted-foreground">
                          {l.reason || '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" onClick={() => openReview(l)}>
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </CardFooter>
          </Card>

          <Dialog
            open={!!selected}
            onOpenChange={open => {
              if (!open) setSelected(null);
            }}
          >
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Review Leave Request</DialogTitle>
              </DialogHeader>
              {selected ? (
                <div className="space-y-5 text-sm">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <div className="text-muted-foreground">Request ID</div>
                      <div className="font-medium">{selected.l_id}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Employee</div>
                      <div className="font-medium">{selected.added_by_user}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Leave Type</div>
                      <div>{selected.leave_type}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Dates</div>
                      <div>
                        {formatDate(selected.start_date)} → {formatDate(selected.end_date)}
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <div className="text-muted-foreground">Reason</div>
                      <div className="whitespace-pre-wrap">{selected.reason}</div>
                    </div>
                  </div>

                  <div className="space-y-3 rounded-md border bg-muted/30 p-4">
                    <div className="font-semibold">Employee Info</div>
                    {reviewLoading ? (
                      <Skeleton className="h-20 w-full" />
                    ) : userInfo ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <span className="block text-muted-foreground">Full Name</span>
                          {userInfo.Full_name || userInfo.name || '—'}
                        </div>
                        <div>
                          <span className="block text-muted-foreground">Email</span>
                          {userInfo.email || '—'}
                        </div>
                        <div>
                          <span className="block text-muted-foreground">Emp Code</span>
                          {userInfo.emp_code || '—'}
                        </div>
                        <div>
                          <span className="block text-muted-foreground">Department</span>
                          {userInfo.department || '—'}
                        </div>
                        <div>
                          <span className="block text-muted-foreground">Job Role</span>
                          {userInfo.job_role || '—'}
                        </div>
                        <div>
                          <span className="block text-muted-foreground">Company</span>
                          {userInfo.company_name || '—'}
                        </div>
                      </div>
                    ) : (
                      <div className="text-muted-foreground">No additional employee info</div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="font-semibold">Decision</div>
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name="decision"
                          checked={decision === 'approved'}
                          onChange={() => setDecision('approved')}
                        />
                        Approve
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name="decision"
                          checked={decision === 'rejected'}
                          onChange={() => setDecision('rejected')}
                        />
                        Reject
                      </label>
                    </div>
                    {decision === 'rejected' ? (
                      <div className="space-y-1">
                        <div className="text-muted-foreground">Reject Reason</div>
                        <textarea
                          className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          value={rejectReason}
                          onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setRejectReason(event.target.value)}
                          placeholder="Provide a note for rejection"
                        />
                      </div>
                    ) : null}
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setSelected(null)}>
                      Cancel
                    </Button>
                    <Button onClick={submitReview} disabled={!decision}>
                      Submit
                    </Button>
                  </div>
                </div>
              ) : null}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </>
  );
}
