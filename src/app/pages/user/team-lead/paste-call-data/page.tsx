'use client';

const LABELS: Record<string, string> = {
  f_campaign_name: 'Campaign',
  f_lead: 'Lead',
  f_resource_name: 'Resource Name',
  f_data_source: 'Data Source',
  f_salutation: 'Salutation',
  f_first_name: 'First Name',
  f_last_name: 'Last Name',
  f_job_title: 'Job Title',
  f_department: 'Department',
  f_job_level: 'Job Level',
  f_email_add: 'Email',
  Secondary_Email: 'Secondary Email',
  f_conatct_no: 'Contact Number',
  f_company_name: 'Company Name',
  f_website: 'Website',
  f_address1: 'Address',
  f_city: 'City',
  f_state: 'State',
  f_zip_code: 'ZIP Code',
  f_country: 'Country',
  f_emp_size: 'Employee Size',
  f_industry: 'Industry',
  f_sub_industry: 'Sub Industry',
  f_revenue: 'Revenue',
  f_revenue_link: 'Revenue Link',
  f_profile_link: 'Profile Link',
  f_company_link: 'Company Link',
  f_address_link: 'Address Link',
  f_cq1: 'CQ 1',
  f_cq2: 'CQ 2',
  f_cq3: 'CQ 3',
  f_cq4: 'CQ 4',
  f_cq5: 'CQ 5',
  f_cq6: 'CQ 6',
  f_cq7: 'CQ 7',
  f_cq8: 'CQ 8',
  f_cq9: 'CQ 9',
  f_cq10: 'CQ 10',
  f_asset_name1: 'Asset Name 1',
  f_asset_name2: 'Asset Name 2',
  f_call_recording: 'Call Recording',
  f_dq_reason1: 'DQ Reason 1',
  f_dq_reason2: 'DQ Reason 2',
  f_dq_reason3: 'DQ Reason 3',
  f_dq_reason4: 'DQ Reason 4',
  f_call_links: 'Call Links',
  f_date: 'Date',
  added_by_user_id: 'Added By'
};

const prettyLabel = (key: string) =>
  LABELS[key] ??
  key
    .replace(/^f_/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());

import React, { useState, useEffect } from 'react';
import { SidebarConfig } from '@/components/sidebar-config';
import DialerModal from '@/components/dialer/dialer-modal';
import SipLoginModal from '@/components/dialer/sip-login-modal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DateTimePicker } from '@/components/ui/date-picker-10';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const FIELDS = [
  'f_campaign_name',
  'f_lead',
  'f_resource_name',
  'f_data_source',
  'f_salutation',
  'f_first_name',
  'f_last_name',
  'f_job_title',
  'f_department',
  'f_job_level',
  'f_email_add',
  'Secondary_Email',
  'f_conatct_no',
  'f_company_name',
  'f_website',
  'f_address1',
  'f_city',
  'f_state',
  'f_zip_code',
  'f_country',
  'f_emp_size',
  'f_industry',
  'f_sub_industry',
  'f_revenue',
  'f_revenue_link',
  'f_profile_link',
  'f_company_link',
  'f_address_link',
  'f_cq1',
  'f_cq2',
  'f_cq3',
  'f_cq4',
  'f_cq5',
  'f_cq6',
  'f_cq7',
  'f_cq8',
  'f_cq9',
  'f_cq10',
  'f_asset_name1',
  'f_asset_name2',
  'f_call_recording',
  'f_dq_reason1',
  'f_dq_reason2',
  'f_dq_reason3',
  'f_dq_reason4',
  'f_call_links',
  'f_date',
  'added_by_user_id'
];

const COUNTRY_CODES = ['+91', '+1', '+44', '+61', '+65'];
const EMPTY = '__none__';
const splitPhone = (v: string) => {
  const code = COUNTRY_CODES.find(c => v?.startsWith(c)) || COUNTRY_CODES[0];
  const local = v?.startsWith(code) ? v.slice(code.length) : v || '';
  return { code, local };
};

function getCurrentUserName() {
  // TODO: Replace with your real authentication/session logic
  if (typeof window !== 'undefined') {
    // Example: return window.session?.user?.name || 'Current User';
    return localStorage.getItem('userName') || 'Current User';
  }
  return 'Current User';
}

export default function UserPage() {
  const userName = getCurrentUserName();
  const [authUserName, setAuthUserName] = useState<string>('');
  const [authDept, setAuthDept] = useState<string>('');
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [formData, setFormData] = useState<Record<string, string | null>>({
    ...Object.fromEntries(FIELDS.map(f => [f, ''])),
    added_by_user_id: userName
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [dialOpen, setDialOpen] = useState(false);
  const [dialNumber, setDialNumber] = useState<string>('');
  const [sipOpen, setSipOpen] = useState(false);
  const [sipStatus, setSipStatus] = useState<string>('');
  const [lastRecordingUrl, setLastRecordingUrl] = useState<string>('');
  const [campaigns, setCampaigns] = useState<
    Array<{ id: number; f_campaign_name: string; f_script?: string | null; f_script_url?: string | null }>
  >([]);

  const onChange = (key: string, value: string) => {
    setFormData(s => ({ ...s, [key]: value }));
  };

  const toDateTimeString = (d: Date | null) => {
    if (!d) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${y}-${m}-${day} ${hh}:${mm}:${ss}`;
  };

  const fromDateTimeString = (s?: string | null): Date | null => {
    if (!s) return null;
    // support both 'YYYY-MM-DD HH:MM:SS' and 'YYYY-MM-DDTHH:MM[:SS]'
    const t = s.replace('T', ' ');
    const [datePart, timePart = '00:00:00'] = t.split(' ');
    const [y, m, d] = datePart.split('-').map(n => parseInt(n, 10));
    const [hh = 0, mm = 0, ss = 0] = timePart.split(':').map(n => parseInt(n, 10));
    if (!y || !m || !d) return null;
    return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, ss || 0);
  };

  // Ensure added_by_user_id is always set to userName
  useEffect(() => {
    setFormData(s => ({ ...s, added_by_user_id: getCurrentUserName() }));
    const ext = typeof window !== 'undefined' ? localStorage.getItem('extension') : null;
    setSipStatus(ext ? `Logged in as ${ext}` : 'Not logged in');
    // Try to fetch authenticated user
    fetch('/api/auth/me', { credentials: 'include' })
      .then(async r => {
        if (r.status === 401 || r.status === 403) {
          // Not authenticated, redirect to login/home
          if (typeof window !== 'undefined') window.location.href = '/';
          return;
        }
        if (!r.ok) return;
        const me = await r.json();
        const pretty = (me?.name || '').trim();
        setAuthDept(String(me?.department || ''));
        if (pretty) {
          setAuthUserName(pretty);
          setFormData(s => ({ ...s, added_by_user_id: pretty }));
          try {
            localStorage.setItem('userName', pretty);
          } catch {}
          try {
            localStorage.setItem('authUser', JSON.stringify(me));
          } catch {}
        }
      })
      .catch(() => {})
      .finally(() => setAuthLoading(false));
  }, []);

  // Read last call recording URL saved by Dialer after a call
  useEffect(() => {
    try {
      const u = typeof window !== 'undefined' ? localStorage.getItem('lastRecordingUrl') : '';
      if (u) setLastRecordingUrl(u);
    } catch {}
  }, []);

  // Load campaigns for dropdown
  useEffect(() => {
    fetch('/api/campaigns')
      .then(r => r.json())
      .then(j => {
        if (j?.data) setCampaigns(j.data);
      })
      .catch(() => {});
  }, []);

  const openSelectedCampaignScript = () => {
    const name = String(formData.f_campaign_name || '');
    if (!name) return;
    const camp = campaigns.find(c => String(c.f_campaign_name) === name);
    if (!camp) return;
    const url = camp.f_script_url;
    if (url) {
      if (typeof window !== 'undefined') window.open(url, '_blank');
      return;
    }
    const txt = (camp.f_script || '').trim();
    if (txt && typeof window !== 'undefined') {
      const w = window.open('', '_blank');
      if (w) {
        w.document.write(
          `<pre style="white-space:pre-wrap;font-family:ui-monospace,monospace;padding:12px;">${txt.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[m] as string)}</pre>`
        );
        w.document.close();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (!res.ok) {
        setMessage('Error: ' + (json?.error ?? res.statusText));
      } else {
        setMessage('Saved. InsertedId: ' + (json?.insertedId ?? 'unknown'));
      }
    } catch (err) {
      setMessage('Network error: ' + String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SidebarConfig role="user" />
      <div className="p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Paste Call Data</h1>
            <p className="text-sm text-muted-foreground"></p>
          </div>

          {authLoading ? (
            <div className="rounded border border-muted/50 bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
              Checking permissions...
            </div>
          ) : null}
          {!authLoading && authDept.toLowerCase() !== 'operation' ? (
            <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Forbidden: Paste call data is restricted to the Operation department.
            </div>
          ) : null}

          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Form Fields</CardTitle>
              <CardDescription>Provide all relevant details before submitting.</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleSubmit}
                className="space-y-6"
                aria-disabled={authDept.toLowerCase() !== 'operation'}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {FIELDS.filter(f => f !== 'added_by_user_id').map(f => (
                    <div key={f} className="space-y-2">
                      <Label htmlFor={f}>{prettyLabel(f)}</Label>
                      {f === 'f_conatct_no' ? (
                        (() => {
                          const { code, local } = splitPhone(String(formData[f] || ''));
                          return (
                            <div className="flex items-center gap-2">
                              <Select
                                value={code}
                                onValueChange={cc => {
                                  onChange(f, `${cc}${local}`);
                                }}
                              >
                                <SelectTrigger className="w-[120px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {COUNTRY_CODES.map(cc => (
                                    <SelectItem key={cc} value={cc}>
                                      {cc}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Input
                                id={f}
                                value={local}
                                onChange={e => onChange(f, `${code}${e.target.value}`)}
                                inputMode="tel"
                              />
                              <Button
                                type="button"
                                size="sm"
                                className="shrink-0"
                                disabled={!formData[f]}
                                onClick={() => {
                                  const ext = typeof window !== 'undefined' ? localStorage.getItem('extension') : null;
                                  if (!ext) {
                                    setSipOpen(true);
                                    return;
                                  }
                                  setDialNumber(String(formData[f] || ''));
                                  setDialOpen(true);
                                }}
                              >
                                Call
                              </Button>
                            </div>
                          );
                        })()
                      ) : f === 'f_campaign_name' ? (
                        <div className="flex items-center gap-2">
                          <Select
                            value={formData[f] || '' || EMPTY}
                            onValueChange={v => onChange(f, v === EMPTY ? '' : v)}
                          >
                            <SelectTrigger id={f} className="w-full">
                              <SelectValue placeholder="Select campaign..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={EMPTY}>Select campaign...</SelectItem>
                              {campaigns.map(c => (
                                <SelectItem key={c.id} value={c.f_campaign_name}>
                                  {c.f_campaign_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="shrink-0"
                            disabled={!formData[f]}
                            onClick={openSelectedCampaignScript}
                          >
                            Open Script
                          </Button>
                        </div>
                      ) : f === 'f_date' ? (
                        <DateTimePicker
                          label=""
                          value={fromDateTimeString(String(formData[f] || ''))}
                          onChange={d => onChange(f, toDateTimeString(d))}
                        />
                      ) : (
                        <Input
                          id={f}
                          value={formData[f] ?? ''}
                          onChange={e => onChange(f, e.target.value)}
                          type={f.includes('email') ? 'email' : 'text'}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <input type="hidden" name="added_by_user_id" value={formData.added_by_user_id ?? ''} />

                <div className="flex items-center gap-3 pt-4 border-t">
                  <Button type="submit" disabled={loading || authDept.toLowerCase() !== 'operation'}>
                    {loading ? 'Saving...' : 'Save to DB'}
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setSipOpen(true)}>
                    SIP Login
                  </Button>
                  <div className="text-xs text-muted-foreground">{sipStatus}</div>
                  {message ? (
                    <div className={`text-sm ${message.includes('Error') ? 'text-destructive' : 'text-emerald-600'}`}>
                      {message}
                    </div>
                  ) : null}
                </div>
              </form>
            </CardContent>
          </Card>

          <DialerModal
            open={dialOpen}
            onClose={() => setDialOpen(false)}
            number={dialNumber}
            userName={authUserName || getCurrentUserName()}
          />
          <SipLoginModal
            open={sipOpen}
            onClose={() => {
              setSipOpen(false);
              const ext = typeof window !== 'undefined' ? localStorage.getItem('extension') : null;
              setSipStatus(ext ? `Logged in as ${ext}` : 'Not logged in');
            }}
          />
        </div>
      </div>
    </>
  );
}
