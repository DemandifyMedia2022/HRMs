'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { SidebarConfig } from '@/components/sidebar-config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';

export default function AddCampaignPage() {
  const [editId, setEditId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authRole, setAuthRole] = useState<string>('');
  const [authDept, setAuthDept] = useState<string>('');
  const [authEmail, setAuthEmail] = useState<string>('');

  const [form, setForm] = useState({
    c_id: '',
    f_campaign_name: '',
    f_start_date: '',
    f_end_date: '',
    f_assignto: '',
    f_allocation: '',
    f_method: '',
    f_script: '',
    f_status: true,
    f_script_url: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const onChange = (k: string, v: string | boolean) => setForm((s: any) => ({ ...s, [k]: v }));

  const toYMD = (d?: Date) =>
    d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : '';
  const fromYMD = (s?: string): Date | undefined => {
    if (!s) return undefined;
    const [y, m, dd] = s.split('-').map(n => parseInt(n, 10));
    if (!y || !m || !dd) return undefined;
    return new Date(y, (m || 1) - 1, dd || 1);
  };

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

  useEffect(() => {
    // Derive editId only on client to avoid SSR/client mismatch
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    const id = sp.get('editId') || null;
    setEditId(id);
    if (!id) return;
    (async () => {
      try {
        const r = await fetch(`/api/campaigns/${id}`, { credentials: 'include' });
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || r.statusText);
        const rec = j?.data || {};
        setForm(
          s =>
            ({
              ...s,
              c_id: String(rec.c_id ?? ''),
              f_campaign_name: String(rec.f_campaign_name ?? ''),
              f_start_date: rec.f_start_date ? String(rec.f_start_date).slice(0, 10) : '',
              f_end_date: rec.f_end_date ? String(rec.f_end_date).slice(0, 10) : '',
              f_assignto: String(rec.f_assignto ?? ''),
              f_allocation: String(rec.f_allocation ?? ''),
              f_method: String(rec.f_method ?? ''),
              f_script: String(rec.f_script ?? ''),
              f_status: !!Number(rec.f_status ?? 1),
              f_script_url: String(rec.f_script_url ?? '')
            }) as any
        );
      } catch {}
    })();
  }, []);

  const allowed = useMemo(() => {
    const norm = (v: string) => (v || '').toLowerCase().replace(/[\-_]/g, ' ').replace(/\s+/g, ' ').trim();
    const role = norm(authRole);
    const email = (authEmail || '').toLowerCase();
    return (
      role.includes('assistant team lead') ||
      role.includes('head of operation') ||
      email === 'asfiya.pathan@demandifymedia.com' ||
      email === 'viresh.kumbhar@demandifymedia.com' ||
      email === 'tejal.kamble@demandifymedia.com'
    );
  }, [authRole, authEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allowed) return;
    setLoading(true);
    setMessage(null);
    try {
      const isEdit = !!editId;
      const url = isEdit ? `/api/campaigns/${editId}` : '/api/campaigns';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || res.statusText);
      setMessage(isEdit ? 'Campaign updated successfully.' : 'Campaign added successfully.');
      setForm({
        c_id: '',
        f_campaign_name: '',
        f_start_date: '',
        f_end_date: '',
        f_assignto: '',
        f_allocation: '',
        f_method: '',
        f_script: '',
        f_status: true,
        f_script_url: ''
      } as any);
    } catch (err: any) {
      setMessage('Error: ' + String(err?.message || err));
    } finally {
      setLoading(false);
    }
  };

  const onScriptFile = async (file?: File | null) => {
    if (!file) return;
    setUploading(true);
    setMessage(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/campaigns/upload', { method: 'POST', body: fd });
      const j = await res.json();
      if (!res.ok || j.error) throw new Error(j.error || res.statusText);
      onChange('f_script_url', String(j.url || ''));
      setMessage('Script uploaded.');
    } catch (e: any) {
      setMessage('Error uploading script: ' + String(e?.message || e));
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <SidebarConfig role="admin" />
      <div className="p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">{editId ? 'Edit Campaign' : 'Add Campaign'}</h1>
            <p className="text-sm text-muted-foreground"></p>
          </div>

          {authLoading ? (
            <div className="rounded border border-muted/50 bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
              Checking permissions...
            </div>
          ) : null}
          {!authLoading && !allowed ? (
            <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Forbidden: You do not have permission to add campaigns.
            </div>
          ) : null}

          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Campaign Details</CardTitle>
              <CardDescription>Fill out the campaign information below.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="c_id">Campaign ID</Label>
                  <Input id="c_id" value={form.c_id} onChange={e => onChange('c_id', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="f_campaign_name">Campaign Name</Label>
                  <Input
                    id="f_campaign_name"
                    value={form.f_campaign_name}
                    onChange={e => onChange('f_campaign_name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <DatePicker
                    id="f_start_date"
                    label="Start Date"
                    value={fromYMD(form.f_start_date)}
                    onChange={d => onChange('f_start_date', toYMD(d))}
                  />
                </div>
                <div className="space-y-2">
                  <DatePicker
                    id="f_end_date"
                    label="End Date"
                    value={fromYMD(form.f_end_date)}
                    onChange={d => onChange('f_end_date', toYMD(d))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="f_assignto">Assign To</Label>
                  <Input
                    id="f_assignto"
                    value={form.f_assignto}
                    onChange={e => onChange('f_assignto', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="f_allocation">Allocation</Label>
                  <Input
                    id="f_allocation"
                    type="number"
                    value={form.f_allocation}
                    onChange={e => onChange('f_allocation', e.target.value)}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="f_method">Method</Label>
                  <Input
                    id="f_method"
                    value={form.f_method}
                    onChange={e => onChange('f_method', e.target.value)}
                    placeholder="Email / Call / Mixed"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="f_script">Script</Label>
                  <textarea
                    id="f_script"
                    className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    rows={4}
                    value={form.f_script}
                    onChange={e => onChange('f_script', e.target.value)}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="f_script_file">Script Document (upload)</Label>
                  <Input
                    id="f_script_file"
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.rtf,.md,.html,.htm"
                    onChange={e => onScriptFile(e.target.files?.[0])}
                  />
                  {uploading ? <div className="text-xs text-muted-foreground">Uploading...</div> : null}
                  {(form as any).f_script_url ? (
                    <div className="text-xs">
                      Uploaded:{' '}
                      <a className="text-primary underline" href={(form as any).f_script_url} target="_blank">
                        Open
                      </a>
                    </div>
                  ) : null}
                </div>
                <div className="flex items-center gap-3 sm:col-span-2">
                  <Label className="m-0">Status</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant={form.f_status ? 'default' : 'outline'}
                    onClick={() => onChange('f_status', !form.f_status)}
                  >
                    {form.f_status ? 'Active' : 'Inactive'}
                  </Button>
                </div>

                <CardFooter className="px-0 sm:col-span-2 flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button type="submit" disabled={loading || !allowed}>
                    {loading ? 'Saving...' : editId ? 'Save Changes' : 'Add Campaign'}
                  </Button>
                  {message ? (
                    <div className={`text-sm ${message.startsWith('Error') ? 'text-destructive' : 'text-emerald-600'}`}>
                      {message}
                    </div>
                  ) : null}
                </CardFooter>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
