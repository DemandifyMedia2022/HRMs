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
  Managerapproval: string;
  ManagerRejecjetReason: string | null;
  leaveregdate: string;
  added_by_user: string;
  emp_code?: string | null;
  department?: string | null;
  job_role?: string | null;
  company_name?: string | null;
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

export default function ManagerLeavesPage() {
  const currentMonth = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }).slice(0, 7);
  const [leaveType, setLeaveType] = useState('');
  const [month, setMonth] = useState(currentMonth); // YYYY-MM
  const [userName, setUserName] = useState('');
  const [status, setStatus] = useState('all'); // Managerapproval filter; 'all' means no filter
  const [hrStatus, setHrStatus] = useState('all'); // HR approval filter for all leaves view

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
  const [isReportingManager, setIsReportingManager] = useState(false);
  const [viewMode, setViewMode] = useState<'team' | 'all'>('team'); // Toggle between team and all leaves

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (leaveType) p.set('leave_type', leaveType);
    if (month) p.set('month', month);
    if (userName) p.set('user_name', userName);
    if (status && status !== 'all') {
      p.set('Manager_Status', status);
    }
    if (hrStatus && hrStatus !== 'all') {
      p.set('HR_Status', hrStatus);
    }
    p.set('page', String(page));
    p.set('pageSize', String(pageSize));
    return p.toString();
  }, [leaveType, month, userName, status, hrStatus, page, pageSize, viewMode]);

  // Check if current user is a reporting manager
  useEffect(() => {
    async function checkReportingManager() {
      try {
        const res = await fetch('/api/users/me', { cache: 'no-store' });
        if (res.ok) {
          const user = await res.json();
          setCurrentUser(user);
          
          // Check if this user is a reporting manager for anyone
          const managerRes = await fetch('/api/users/reporting-manager-check', { cache: 'no-store' });
          if (managerRes.ok) {
            const data = await managerRes.json();
            setIsReportingManager(data.isReportingManager);
          }
        }
      } catch (err) {
        console.error('Failed to check reporting manager status:', err);
      }
    }
    
    checkReportingManager();
  }, []);

  async function load() {
    if (!isReportingManager) return;
    
    setLoading(true);
    setError(null);
    try {
      const endpoint = viewMode === 'team' ? '/api/leaves/manager-team' : '/api/leaves/all-leaves';
      const res = await fetch(`${endpoint}?${qs}`, { cache: 'no-store' });
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
    if (isReportingManager) {
      load();
    }
  }, [qs, isReportingManager]);

  async function updateStatus(id: number, approve: boolean) {
    const payload: any = approve
      ? { id, Managerapproval: 'approved', ManagerRejecjetReason: '', manager_approved_by: currentUser?.Full_name || currentUser?.name }
      : { id, Managerapproval: 'rejected', ManagerRejecjetReason: 'Rejected by Manager', manager_approved_by: currentUser?.Full_name || currentUser?.name };
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
        ? { id: selected.l_id, Managerapproval: 'approved', ManagerRejecjetReason: '', manager_approved_by: currentUser?.Full_name || currentUser?.name }
        : { id: selected.l_id, Managerapproval: 'rejected', ManagerRejecjetReason: rejectReason || 'Rejected by Manager', manager_approved_by: currentUser?.Full_name || currentUser?.name };
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
    setHrStatus('all');
    setPage(1);
  }

  if (!isReportingManager) {
    return (
      <div className="p-6">
        <Alert>
          <AlertDescription>
            You don't have access to this page. Only reporting managers can view and approve leaves of their team members.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      {flash ? (
        <div className="border border-green-200 bg-green-50 text-green-700 rounded px-3 py-2 text-sm">{flash}</div>
      ) : null}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{viewMode === 'team' ? 'Team Leaves Management' : 'All Leaves Management'}</h1>
          <div className="text-sm text-muted-foreground">
            {viewMode === 'team' ? 'Managing leaves for users who report to you' : 'Viewing all leave requests in the organization'}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'team' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setViewMode('team');
              setPage(1);
            }}
          >
            Team Leaves
          </Button>
          <Button
            variant={viewMode === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setViewMode('all');
              setPage(1);
            }}
          >
            All Leaves
          </Button>
        </div>
      </div>

      <div className="border rounded p-4">
        <div className={`grid gap-3 ${viewMode === 'all' ? 'grid-cols-1 md:grid-cols-6' : 'grid-cols-1 md:grid-cols-5'}`}>
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
            <Label>Manager Status</Label>
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
          {viewMode === 'all' && (
            <div className="space-y-1">
              <Label>HR Status</Label>
              <Select value={hrStatus} onValueChange={v => setHrStatus(v)}>
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
          )}
          <div className="flex items-end gap-2">
            <Button
              variant="outline"
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

      <div className="border rounded p-4">
        <div className="text-sm text-muted-foreground mb-2">Total: {total}</div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Apply</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>User</TableHead>
                {viewMode === 'all' && <TableHead>Emp Code</TableHead>}
                {viewMode === 'all' && <TableHead>Department</TableHead>}
                <TableHead>HR Status</TableHead>
                <TableHead>Manager Status</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="py-4">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={viewMode === 'all' ? 12 : 10} className="py-4">
                    No records found
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((l, idx) => (
                  <TableRow key={l.l_id}>
                    <TableCell>{(page - 1) * pageSize + idx + 1}</TableCell>
                    <TableCell>{l.leave_type}</TableCell>
                    <TableCell>{l.leaveregdate ? new Date(l.leaveregdate).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>{new Date(l.start_date).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(l.end_date).toLocaleDateString()}</TableCell>
                    <TableCell>{l.added_by_user}</TableCell>
                    {viewMode === 'all' && <TableCell>{l.emp_code || '-'}</TableCell>}
                    {viewMode === 'all' && <TableCell>{l.department || '-'}</TableCell>}
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${
                        l.HRapproval === 'approved' ? 'bg-green-100 text-green-800' :
                        l.HRapproval === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {l.HRapproval}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${
                        l.Managerapproval === 'approved' ? 'bg-green-100 text-green-800' :
                        l.Managerapproval === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {l.Managerapproval}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[240px] truncate" title={l.reason}>
                      {l.reason}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" onClick={() => openReview(l)}>
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="text-sm">
            Page {page} of {totalPages}
          </div>
          <div className="space-x-2">
            <Button variant="outline" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
              Prev
            </Button>
            <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              Next
            </Button>
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
            <DialogTitle>Review Team Leave Request</DialogTitle>
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
                {selected.emp_code && (
                  <div>
                    <div className="text-gray-500">Emp Code</div>
                    <div>{selected.emp_code}</div>
                  </div>
                )}
                {selected.department && (
                  <div>
                    <div className="text-gray-500">Department</div>
                    <div>{selected.department}</div>
                  </div>
                )}
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
                <div className="font-semibold">Your Decision (Manager Approval)</div>
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
                  Submit Decision
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
