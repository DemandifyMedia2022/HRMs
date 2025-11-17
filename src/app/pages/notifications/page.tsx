'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type Me = { email: string; role: string; name?: string | null };

type Issue = {
  id: number;
  name: string | null;
  reason: string | null;
  added_by_user: string | null;
  status: string | null;
  Date_Attendance_Update: string | null;
  Attendance_status: string | null;
  Attendance_Approval: string | null;
  raisedate: string | null;
};

export default function Page() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const [myReqs, setMyReqs] = useState<Issue[]>([]);
  const [pendingForHr, setPendingForHr] = useState<Issue[]>([]);
  const [recentApprovals, setRecentApprovals] = useState<Issue[]>([]);

  const role = (me?.role || 'user').toLowerCase();

  async function load() {
    setLoading(true);
    setError('');
    try {
      const meRes = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' });
      if (!meRes.ok) throw new Error('Failed to load user');
      const meJson = await meRes.json();
      setMe({ email: meJson?.email, role: String(meJson?.role || 'user'), name: meJson?.name || null });

      const [mineRes, pendingRes, approvedRes] = await Promise.all([
        fetch('/api/attendance/request-update?my=1', { cache: 'no-store' }),
        fetch('/api/attendance/request-update?status=pending', { cache: 'no-store' }),
        fetch('/api/attendance/request-update?status=approved', { cache: 'no-store' })
      ]);

      const [mine, pending, approved] = await Promise.all([
        mineRes.ok ? mineRes.json() : { data: [] },
        pendingRes.ok ? pendingRes.json() : { data: [] },
        approvedRes.ok ? approvedRes.json() : { data: [] }
      ]);

      setMyReqs((mine?.data || []).slice(0, 20));
      setPendingForHr((pending?.data || []).slice(0, 20));
      setRecentApprovals((approved?.data || []).slice(0, 20));
    } catch (e: any) {
      setError(e?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const showHr = role === 'hr' || role === 'admin' || role === 'user';

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Notifications</h1>
        <Button variant="outline" onClick={load} disabled={loading}>
          Refresh
        </Button>
      </div>

      {error ? <div className="text-sm text-red-600">{error}</div> : null}

      <Card>
        <CardHeader>
          <CardTitle>My Attendance Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm">Loading…</div>
          ) : myReqs.length === 0 ? (
            <div className="text-sm text-muted-foreground">No recent requests.</div>
          ) : (
            <ul className="space-y-3 text-sm">
              {myReqs.map(r => {
                const date = r.Date_Attendance_Update?.slice(0, 10) || '';
                const status = r.Attendance_Approval || r.status || 'pending';
                return (
                  <li key={r.id} className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">
                        {date} · {r.Attendance_status || '—'}
                      </div>
                      <div className="text-muted-foreground">Status: {status}</div>
                    </div>
                    <a className="text-blue-600 hover:underline" href="/pages/hr/attendance/request-update">
                      View
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {showHr ? (
        <Card>
          <CardHeader>
            <CardTitle>Pending Attendance Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm">Loading…</div>
            ) : pendingForHr.length === 0 ? (
              <div className="text-sm text-muted-foreground">No pending approvals.</div>
            ) : (
              <ul className="space-y-3 text-sm">
                {pendingForHr.map(r => (
                  <li key={r.id} className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{r.added_by_user || r.name || ''}</div>
                      <div className="text-muted-foreground">
                        {r.Date_Attendance_Update?.slice(0, 10) || ''} · Requested: {r.Attendance_status || '—'}
                      </div>
                    </div>
                    <a className="text-blue-600 hover:underline" href="/pages/hr/attendance/status">
                      Review
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ) : null}

      {showHr ? (
        <Card>
          <CardHeader>
            <CardTitle>Recent Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm">Loading…</div>
            ) : recentApprovals.length === 0 ? (
              <div className="text-sm text-muted-foreground">No recent approvals.</div>
            ) : (
              <ul className="space-y-3 text-sm">
                {recentApprovals.map(r => (
                  <li key={r.id} className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{r.added_by_user || r.name || ''}</div>
                      <div className="text-muted-foreground">
                        {r.Date_Attendance_Update?.slice(0, 10) || ''} · {r.Attendance_status || '—'}
                      </div>
                    </div>
                    <a className="text-blue-600 hover:underline" href="/pages/hr/attendance/status">
                      Open
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
