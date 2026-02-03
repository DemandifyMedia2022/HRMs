'use client';

import { useEffect, useMemo, useState, type ChangeEvent } from 'react';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';

type Leave = {
  l_id: number;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  HRapproval: string;
  HRrejectReason: string | null;
  hr_approved_by: string | null;
  Managerapproval: string;
  ManagerRejecjetReason: string | null;
  manager_approved_by: string | null;
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
  const currentMonth = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }).slice(0, 7);
  const [leaveType, setLeaveType] = useState('');
  const [month, setMonth] = useState(currentMonth); // YYYY-MM
  const [userName, setUserName] = useState('');
  const [status, setStatus] = useState('all'); // HRapproval filter; 'all' means no filter

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
  const [currentUser, setCurrentUser] = useState<any | null>(null);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (leaveType) p.set('leave_type', leaveType);
    if (month) p.set('month', month);
    if (userName) p.set('user_name', userName);
    if (status && status !== 'all') p.set('Leaves_Status', status);
    p.set('page', String(page));
    p.set('pageSize', String(pageSize));
    return p.toString();
  }, [leaveType, month, userName, status, page, pageSize]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      // Get current user info
      const userRes = await fetch('/api/auth/me', { cache: 'no-store' });
      if (userRes.ok) {
        const userData = await userRes.json();
        console.log('HR user data:', userData);
        setCurrentUser(userData);
      } else {
        console.log('HR user auth failed:', userRes.status);
      }

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
    console.log('HR updateStatus called:', { id, approve, currentUser });
    const payload: any = approve
      ? { id, HRapproval: 'approved', HRrejectReason: '', hr_approved_by: currentUser?.Full_name || currentUser?.name || 'HR Department' }
      : { id, HRapproval: 'rejected', HRrejectReason: 'Rejected by HR', hr_approved_by: currentUser?.Full_name || currentUser?.name || 'HR Department' };
    console.log('HR payload:', payload);
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
        ? { id: selected.l_id, HRapproval: 'approved', HRrejectReason: '', hr_approved_by: currentUser?.Full_name || currentUser?.name || 'HR Department' }
        : { id: selected.l_id, HRapproval: 'rejected', HRrejectReason: rejectReason || 'Rejected by HR', hr_approved_by: currentUser?.Full_name || currentUser?.name || 'HR Department' };
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
    setMonth(currentMonth);
    setUserName('');
    setStatus('all');
    setPage(1);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-full">
        {flash ? (
          <div className="mb-4 border border-green-200 bg-green-50 text-green-700 rounded-lg px-4 py-3 text-sm">{flash}</div>
        ) : null}
        
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">All Employee Leaves</h1>
          <p className="text-gray-600 mt-1">View and manage leave requests from all employees</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4 items-end">
          <div className="space-y-1">
            <Label htmlFor="filter-leave-type">Leave Type</Label>
            <Input id="filter-leave-type" value={leaveType} onChange={e => setLeaveType(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="filter-month">Month</Label>
            <Input id="filter-month" type="month" value={month} onChange={e => setMonth(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="filter-user">User Name</Label>
            <Input id="filter-user" value={userName} onChange={e => setUserName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>HR Status</Label>
            <Select value={status} onValueChange={v => setStatus(v)}>
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setPage(1);
                load();
              }}
            >
              Apply
            </Button>
            <Button variant="outline" onClick={resetFilters}>
              Reset
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Leave Requests</h3>
            <span className="text-sm text-gray-500">Total: {total} requests</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px] font-semibold text-gray-900">ID</TableHead>
                <TableHead className="min-w-[100px] font-semibold text-gray-900">Type</TableHead>
                <TableHead className="min-w-[100px] hidden md:table-cell font-semibold text-gray-900">Apply</TableHead>
                <TableHead className="min-w-[100px] font-semibold text-gray-900">Start</TableHead>
                <TableHead className="min-w-[100px] font-semibold text-gray-900">End</TableHead>
                <TableHead className="min-w-[120px] font-semibold text-gray-900">User</TableHead>
                <TableHead className="min-w-[100px] font-semibold text-gray-900">HR Status</TableHead>
                <TableHead className="min-w-[120px] font-semibold text-gray-900">Manager Status</TableHead>
                <TableHead className="min-w-[200px] max-w-[240px] font-semibold text-gray-900">Reason</TableHead>
                <TableHead className="min-w-[120px] hidden lg:table-cell font-semibold text-gray-900">HR Approved By</TableHead>
                <TableHead className="min-w-[140px] hidden lg:table-cell font-semibold text-gray-900">Manager Approved By</TableHead>
                <TableHead className="min-w-[100px] font-semibold text-gray-900">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={12} className="py-4">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="py-4">
                    No records found
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((l, idx) => (
                  <TableRow key={l.l_id}>
                    <TableCell>{(page - 1) * pageSize + idx + 1}</TableCell>
                    <TableCell>{l.leave_type}</TableCell>
                    <TableCell className="hidden md:table-cell">{l.leaveregdate ? new Date(l.leaveregdate).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>{new Date(l.start_date).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(l.end_date).toLocaleDateString()}</TableCell>
                    <TableCell>{l.added_by_user}</TableCell>
                    <TableCell>{l.HRapproval}</TableCell>
                    <TableCell>{l.Managerapproval}</TableCell>
                    <TableCell className="max-w-[240px] truncate" title={l.reason}>
                      {l.reason}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{l.hr_approved_by || '-'}</TableCell>
                    <TableCell className="hidden lg:table-cell">{l.manager_approved_by || '-'}</TableCell>
                    <TableCell>
                      <Button size="sm" onClick={() => openReview(l)}>
                        ⚡ Take Action
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
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
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
      </div>
      <Dialog
        open={!!selected}
        onOpenChange={o => {
          if (!o) setSelected(null);
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Leave Request</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-gray-500">Request ID</div>
                  <div>{selected.l_id}</div>
                </div>
                <div>
                  <div className="text-gray-500">User</div>
                  <div>{selected.added_by_user}</div>
                </div>
                <div>
                  <div className="text-gray-500">Type</div>
                  <div>{selected.leave_type}</div>
                </div>
                <div>
                  <div className="text-gray-500">Dates</div>
                  <div>
                    {new Date(selected.start_date).toLocaleDateString()} →{' '}
                    {new Date(selected.end_date).toLocaleDateString()}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <div className="text-gray-500">Reason</div>
                  <div className="break-words">{selected.reason}</div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="font-semibold mb-2">Employee Info</div>
                {reviewLoading ? (
                  <div>Loading...</div>
                ) : userInfo ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="text-gray-500">Full Name</div>
                      <div>{userInfo.Full_name || userInfo.name || ''}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Email</div>
                      <div>{userInfo.email || ''}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Emp Code</div>
                      <div>{userInfo.emp_code || ''}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Department</div>
                      <div>{userInfo.department || ''}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Job Role</div>
                      <div>{userInfo.job_role || ''}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Company</div>
                      <div>{userInfo.company_name || ''}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500">No additional employee info</div>
                )}
              </div>

              <div className="space-y-2">
                <div className="font-semibold">Decision</div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="decision"
                      checked={decision === 'approved'}
                      onChange={() => setDecision('approved')}
                    />{' '}
                    Approve
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="decision"
                      checked={decision === 'rejected'}
                      onChange={() => setDecision('rejected')}
                    />{' '}
                    Reject
                  </label>
                </div>
                {decision === 'rejected' && (
                  <div>
                    <div className="text-gray-500 mb-1">Reject Reason</div>
                    <textarea
                      className="w-full border rounded px-3 py-2"
                      value={rejectReason}
                      onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setRejectReason(e.target.value)}
                      placeholder="Reason for rejection"
                    />
                  </div>
                )}
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
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
