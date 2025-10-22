'use client';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">HR · Employees · Settlement History</h1>

      <div className="flex items-center gap-2">
        <Input
          value={search}
          onChange={e => {
            setPage(1);
            setSearch(e.target.value);
          }}
          placeholder="Search name, email, emp code"
          className="w-full max-w-md"
        />
        <Select
          value={String(pageSize)}
          onValueChange={v => {
            setPage(1);
            setPageSize(Number(v));
          }}
        >
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error ? <div className="text-red-600 text-sm">{error}</div> : null}

      {loading ? (
        <div className="border rounded p-4 text-sm">Loading...</div>
      ) : rows.length === 0 ? (
        <div className="border rounded p-4 text-sm">No data</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rows.map(r => {
            const displayName = r.full_name || r.name || '';
            return (
              <Card key={r.id} className="hover:shadow transition">
                <button className="w-full text-left" onClick={() => setSelected(r)}>
                  <CardContent className="p-4 flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-700">
                        {initials(displayName)}
                      </div>
                      <div>
                        <div className="font-semibold">{displayName || 'Unnamed'}</div>
                        <div className="text-xs text-gray-600">Employee Code: {r.emp_code || 'N/A'}</div>
                      </div>
                    </div>
                  </CardContent>
                </button>
              </Card>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1 || loading}>
          Prev
        </Button>
        <div className="text-sm">
          Page {page} of {totalPages}
        </div>
        <Button
          variant="outline"
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages || loading}
        >
          Next
        </Button>
      </div>

      <Dialog
        open={!!selected}
        onOpenChange={o => {
          if (!o) setSelected(null);
        }}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Settlement Employee Data</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-700">
                  {initials(selected.full_name || selected.name)}
                </div>
                <div>
                  <div className="text-lg font-semibold">{selected.full_name || selected.name || 'Unnamed'}</div>
                  <div className="text-sm text-gray-600">{selected.company_name || ''}</div>
                  <div className="text-sm text-gray-600">{selected.job_role || ''}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                <div>
                  <div className="text-gray-500">Joining Date</div>
                  <div>{selected.joining_date || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-gray-500">Date of Resignation</div>
                  <div>{fmt(selected.date_of_resignation) || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-gray-500">Expected Last Working Day</div>
                  <div>{fmt(selected.expected_last_working_day) || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-gray-500">Date of Relieving</div>
                  <div>{fmt(selected.date_of_relieving) || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-gray-500">Resignation Reason (Employee)</div>
                  <div className="break-words">{selected.resignation_reason_employee || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-gray-500">Resignation Reason (Approver)</div>
                  <div className="break-words">{selected.resignation_reason_approver || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-gray-500">Employee Other Status</div>
                  <div className="break-words">{selected.settelment_employee_other_status || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-gray-500">Employee Other Status Remarks</div>
                  <div className="break-words">{selected.employee_other_status_remarks || 'N/A'}</div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelected(null)}>
                  Close
                </Button>
                <Button onClick={reinstateEmployee} disabled={reinstateLoading}>
                  {reinstateLoading ? 'Reinstating...' : 'Reinstate Employee'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
