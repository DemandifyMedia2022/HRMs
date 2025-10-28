'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SidebarConfig } from '@/components/sidebar-config';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Page() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [personalEmail, setPersonalEmail] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState('user');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const meRes = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' });
      if (meRes.ok) {
        const me = await meRes.json();
        setRole(String(me?.role || 'user').toLowerCase());
      }
      const res = await fetch('/api/account', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load account');
      const j = await res.json();
      setEmail(j.email || '');
      setName(j.name || '');
      setPersonalEmail(j.personal_email || '');
      setContactNo(j.contact_no || '');
      setDepartment(j.department || '');
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    setSaving(true);
    setError('');
    setMsg('');
    try {
      const res = await fetch('/api/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, personal_email: personalEmail, contact_no: contactNo, department })
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.message || 'Save failed');
      setMsg('Saved');
    } catch (e: any) {
      setError(e?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 space-y-6">
      <SidebarConfig role={role as any} />
      <h1 className="text-xl font-semibold">Account</h1>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-sm">Loading…</div>
          ) : (
            <>
              {error ? <div className="text-sm text-red-600">{error}</div> : null}
              {msg ? <div className="text-sm text-green-700">{msg}</div> : null}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm">Email</div>
                  <Input value={email} disabled />
                </div>
                <div className="space-y-1">
                  <div className="text-sm">Full name</div>
                  <Input value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <div className="text-sm">Personal email</div>
                  <Input value={personalEmail} onChange={e => setPersonalEmail(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <div className="text-sm">Contact number</div>
                  <Input value={contactNo} onChange={e => setContactNo(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <div className="text-sm">Department</div>
                  <Select value={department} onValueChange={setDepartment}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Operation">Operation</SelectItem>
                      <SelectItem value="HR">HR</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Sales">Sales</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="IT">IT</SelectItem>
                      <SelectItem value="Development">Development</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={save} disabled={saving}>
                  {saving ? 'Saving…' : 'Save changes'}
                </Button>
                <Button variant="outline" onClick={load} disabled={loading || saving}>
                  Reset
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
