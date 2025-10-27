'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SidebarConfig } from '@/components/sidebar-config';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type Issue = {
  id: number;
  name: string | null;
  department: string | null;
  issuse_type: string | null;
  reason: string | null;
  added_by_user: string | null;
  status: string | null;
  Date_Attendance_Update: string | null;
  Attendance_status: string | null;
  Attendance_Approval: string | null;
  Attendance_feedback: string | null;
  raisedate: string | null;
};

export default function Page() {
  const [status, setStatus] = useState<string>('all'); // pending/approved/rejected or 'all'
  const [month, setMonth] = useState<string>(''); // YYYY-MM
  const [search, setSearch] = useState<string>(''); // search by user name
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<Issue[]>([]);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [reasonOpen, setReasonOpen] = useState(false);
  const [reasonText, setReasonText] = useState<string>('');
  const [updateOpen, setUpdateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [finalStatus, setFinalStatus] = useState<string>('');
  const [inTime, setInTime] = useState<string>('');
  const [outTime, setOutTime] = useState<string>('');

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status && status !== 'all') params.set('status', status);
      if (month) params.set('month', month);
      const res = await fetch(`/api/attendance/request-update?${params.toString()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      let data: Issue[] = json.data || [];
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        data = data.filter(r => (r.added_by_user || r.name || '').toLowerCase().includes(q));
      }
      setRequests(data);
    } catch {
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, month]);

  async function act(
    id: number,
    approval: 'approved' | 'rejected',
    opts?: { finalStatus?: string; inTime?: string; outTime?: string }
  ) {
    try {
      setSubmittingId(id);
      const feedback = notes[id]?.trim() || undefined;
      const res = await fetch('/api/attendance/request-update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          approval,
          feedback,
          finalStatus: opts?.finalStatus,
          inTime: opts?.inTime,
          outTime: opts?.outTime
        })
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}) as any);
        throw new Error(j?.message || 'Failed to update');
      }
      await load();
      setNotes(prev => ({ ...prev, [id]: '' }));
    } catch (e) {
      // noop: optionally surface error with a toast
    } finally {
      setSubmittingId(null);
    }
  }

  function openReason(reason: string | null) {
    setReasonText(reason || '');
    setReasonOpen(true);
  }

  function openUpdate(r: Issue) {
    setSelectedId(r.id);
    setFinalStatus(r.Attendance_status || 'Present');
    setInTime('');
    setOutTime('');
    setUpdateOpen(true);
  }

  return (
    <div className="p-4 space-y-6">
      <SidebarConfig role="admin" />
      <h1 className="text-xl font-semibold">Admin · Attendance · Requests</h1>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <div className="text-sm">Approval Status</div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full">
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
          <div className="space-y-1">
            <div className="text-sm">Month</div>
            <Input type="month" value={month} onChange={e => setMonth(e.target.value)} />
          </div>
          <div className="space-y-1 md:col-span-2">
            <div className="text-sm">Search by user</div>
            <Input
              placeholder="Type user name"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && load()}
            />
          </div>
          <div className="md:col-span-4 flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setStatus('all');
                setMonth('');
                setSearch('');
              }}
            >
              Reset
            </Button>
            <Button onClick={load}>Apply</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Update Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm">Loading…</div>
          ) : requests.length === 0 ? (
            <div className="text-sm text-gray-600">No requests found.</div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 pr-4">User</th>
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Requested Status</th>
                    <th className="py-2 pr-4">Approval</th>
                    <th className="py-2 pr-4">Reason</th>
                    <th className="py-2 pr-4">Feedback</th>
                    <th className="py-2 pr-4">Raised</th>
                    <th className="py-2 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(r => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">{r.added_by_user || r.name || ''}</td>
                      <td className="py-2 pr-4">{r.Date_Attendance_Update?.slice(0, 10) || ''}</td>
                      <td className="py-2 pr-4">{r.Attendance_status || ''}</td>
                      <td className="py-2 pr-4">{r.Attendance_Approval || r.status || 'pending'}</td>
                      <td className="py-2 pr-4">
                        {r.reason ? (
                          <Button variant="link" className="px-0" onClick={() => openReason(r.reason)}>
                            View
                          </Button>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-2 pr-4 w-[220px]">
                        <Input
                          placeholder="Feedback (optional)"
                          value={notes[r.id] ?? ''}
                          onChange={e => setNotes(prev => ({ ...prev, [r.id]: e.target.value }))}
                        />
                      </td>
                      <td className="py-2 pr-4">{r.raisedate ? new Date(r.raisedate).toLocaleString() : ''}</td>
                      <td className="py-2 pr-4 w-[240px]">
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => openUpdate(r)} disabled={submittingId === r.id}>
                            Update
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => act(r.id, 'rejected')}
                            disabled={submittingId === r.id}
                          >
                            Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={reasonOpen} onOpenChange={setReasonOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reason</DialogTitle>
          </DialogHeader>
          <div className="whitespace-pre-wrap text-sm">{reasonText}</div>
          <DialogFooter>
            <Button onClick={() => setReasonOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={updateOpen} onOpenChange={setUpdateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Attendance</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1 md:col-span-1">
              <div className="text-sm">Final Status</div>
              <Select value={finalStatus} onValueChange={setFinalStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Present">Present</SelectItem>
                  <SelectItem value="Half-day">Half-day</SelectItem>
                  <SelectItem value="Absent">Absent</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <div className="text-sm">In Time</div>
              <Input type="time" value={inTime} onChange={e => setInTime(e.target.value)} />
            </div>
            <div className="space-y-1">
              <div className="text-sm">Out Time</div>
              <Input type="time" value={outTime} onChange={e => setOutTime(e.target.value)} />
            </div>
            <div className="space-y-1 md:col-span-3">
              <div className="text-sm">Feedback (optional)</div>
              <Input
                placeholder="Feedback"
                value={selectedId ? (notes[selectedId] ?? '') : ''}
                onChange={e => selectedId && setNotes(prev => ({ ...prev, [selectedId]: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={async () => {
                if (!selectedId) return;
                await act(selectedId, 'approved', {
                  finalStatus,
                  inTime: inTime || undefined,
                  outTime: outTime || undefined
                });
                setUpdateOpen(false);
              }}
              disabled={submittingId !== null}
            >
              Save & Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
