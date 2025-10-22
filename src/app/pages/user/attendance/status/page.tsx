'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SidebarConfig } from '@/components/sidebar-config';

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
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<Issue[]>([]);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ my: '1' });
      if (status && status !== 'all') params.set('status', status);
      if (month) params.set('month', month);
      const res = await fetch(`/api/attendance/request-update?${params.toString()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setRequests(json.data || []);
    } catch {
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, month]);

  return (
    <>
      <SidebarConfig role="user" />
      <div className="p-4 space-y-6">
        <h1 className="text-xl font-semibold">User · Attendance · Status</h1>

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
            <div className="md:col-span-2 flex items-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setStatus('all');
                  setMonth('');
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
            <CardTitle>My Attendance Update Requests</CardTitle>
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
                      <th className="py-2 pr-4">Date</th>
                      <th className="py-2 pr-4">Requested Status</th>
                      <th className="py-2 pr-4">Approval</th>
                      <th className="py-2 pr-4">Reason</th>
                      <th className="py-2 pr-4">Feedback</th>
                      <th className="py-2 pr-4">Raised</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map(r => (
                      <tr key={r.id} className="border-b last:border-0">
                        <td className="py-2 pr-4">{r.Date_Attendance_Update?.slice(0, 10) || ''}</td>
                        <td className="py-2 pr-4">{r.Attendance_status || ''}</td>
                        <td className="py-2 pr-4">{r.Attendance_Approval || r.status || 'pending'}</td>
                        <td className="py-2 pr-4">{r.reason || ''}</td>
                        <td className="py-2 pr-4">{r.Attendance_feedback || ''}</td>
                        <td className="py-2 pr-4">{r.raisedate ? new Date(r.raisedate).toLocaleString() : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
