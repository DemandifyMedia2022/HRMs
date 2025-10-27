'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { SidebarConfig } from '@/components/sidebar-config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function CampaignListPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authRole, setAuthRole] = useState<string>('');
  const [authDept, setAuthDept] = useState<string>('');
  const [authEmail, setAuthEmail] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [total, setTotal] = useState<number>(0);
  const [search, setSearch] = useState<string>('');

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/status?page=${page}&pageSize=${pageSize}`, { credentials: 'include', cache: 'no-store' });
      const j = await res.json().catch(() => ({}));
      const data = Array.isArray(j?.data) ? j.data : [];
      setRows(data);
      setTotal(Number(j?.total || 0));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(async r => {
        if (!r.ok) return;
        const me = await r.json();
        setAuthEmail(String(me?.email ?? ''));
        setAuthDept(String(me?.department ?? ''));
        setAuthRole(String(me?.job_role ?? me?.role ?? me?.designation ?? me?.title ?? ''));
      })
      .catch(() => {})
      .finally(() => setAuthLoading(false));
  }, []);

  const canEdit = useMemo(() => {
    const norm = (v: string) => (v || '').toLowerCase().replace(/[\-_]/g, ' ').replace(/\s+/g, ' ').trim();
    const role = norm(authRole);
    const dept = (authDept || '').toLowerCase();
    const email = (authEmail || '').toLowerCase();
    return (
      role.includes('assistant team lead') ||
      role.includes('head of operation') ||
      (dept === 'operation' && (role.includes('lead') || role.includes('head'))) ||
      email === 'asfiya.pathan@demandifymedia.com'
    );
  }, [authRole, authDept, authEmail]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(r => `${r.f_campaign_name || ''}`.toLowerCase().includes(q));
  }, [rows, search]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <SidebarConfig role="user" />
      <div className="p-6 space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <h1 className="text-xl font-bold mb-4">Campaign List</h1>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Input
                  placeholder="Search campaigns..."
                  value={search}
                  onChange={e => {
                    setSearch(e.target.value);
                    if (page !== 1) setPage(1);
                  }}
                  className="w-full sm:w-[280px]"
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="text-sm text-muted-foreground">Rows per page</div>
                <Select value={String(pageSize)} onValueChange={v => { setPageSize(Number(v)); setPage(1); }}>
                  <SelectTrigger className="w-[92px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(authLoading || loading) && <div className="text-sm text-muted-foreground">Loading...</div>}

            {!loading && (
              <div className="overflow-x-auto border rounded-md">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted/50 text-foreground">
                    <tr>
                      <th className="text-left px-3 py-2">ID</th>
                      <th className="text-left px-3 py-2">Campaign</th>
                      <th className="text-left px-3 py-2">Start</th>
                      <th className="text-left px-3 py-2">End</th>
                      <th className="text-left px-3 py-2">Status</th>
                      <th className="text-left px-3 py-2">Script</th>
                      <th className="text-left px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(r => (
                      <tr key={r.id} className="border-t">
                        <td className="px-3 py-2">{r.id}</td>
                        <td className="px-3 py-2">{r.f_campaign_name}</td>
                        <td className="px-3 py-2">
                          {r.f_start_date ? new Date(r.f_start_date).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-3 py-2">{r.f_end_date ? new Date(r.f_end_date).toLocaleDateString() : '-'}</td>
                        <td className="px-3 py-2">{Number(r.f_status) ? 'Active' : 'Inactive'}</td>
                        <td className="px-3 py-2">
                          {r.f_script_url ? (
                            <a className="text-blue-600 hover:underline" href={r.f_script_url} target="_blank">
                              Open
                            </a>
                          ) : r.f_script ? (
                            <button
                              className="text-blue-600 hover:underline"
                              onClick={() => {
                                const w = window.open('', '_blank');
                                if (w) {
                                  const esc = String(r.f_script || '').replace(
                                    /[&<>]/g,
                                    m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[m] as string
                                  );
                                  w.document.write(
                                    `<pre style='white-space:pre-wrap;font-family:ui-monospace,monospace;padding:12px;'>${esc}</pre>`
                                  );
                                  w.document.close();
                                }
                              }}
                            >
                              View
                            </button>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {canEdit ? (
                            <Button asChild size="sm">
                              <a href={`/pages/crms/campaigns/add?editId=${r.id}`} title="Edit campaign">Edit</a>
                            </Button>
                          ) : (
                            <span className="text-gray-400 text-xs">No access</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {!filtered.length && (
                      <tr>
                        <td className="px-3 py-6 text-center text-gray-500" colSpan={7}>
                          No campaigns found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-muted-foreground">
                Page {page} of {totalPages} • Total {total}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
