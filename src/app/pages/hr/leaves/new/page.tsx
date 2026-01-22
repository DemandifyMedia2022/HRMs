'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarConfig } from '@/components/sidebar-config';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';

const leaveOptions = ['Casual Leave', 'Sick Leave', 'Paid Leave', 'Comp-Off', 'WFH'];

const toYMD = (d?: Date | null) =>
  d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : '';

const fromYMD = (s: string) => {
  if (!s) return undefined;
  const [y, m, dd] = s.split('-').map(n => parseInt(n, 10));
  if (!y || !m || !dd) return undefined;
  return new Date(y, m - 1, dd);
};

export default function NewLeavePage() {
  const router = useRouter();

  // form state
  const [leaveType, setLeaveType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [employee, setEmployee] = useState(''); // email or name of the employee (added_by_user)
  const [company, setCompany] = useState(''); // hidden client_company_name, derived
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // logged-in HR profile (for scoping the search call and “my leaves” autofill option)
  const [me, setMe] = useState<{ email?: string; name?: string; Full_name?: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const meRes = await fetch('/api/auth/me', { cache: 'no-store' });
        if (meRes.ok) {
          const meJson = await meRes.json();
          setMe(meJson);
          // If HR is applying for themselves, prefill employee with email
          if (meJson?.email) setEmployee(meJson.email);
        }
      } catch {}
    })();
  }, []);

  // Whenever employee changes, try to resolve company to store in hidden field
  async function resolveCompanyForEmployee(emp: string) {
    const q = emp.trim();
    if (!q || !me?.email) {
      setCompany('');
      return;
    }
    try {
      const params = new URLSearchParams({ q, viewer_name: me.email });
      const res = await fetch(`/api/users/search?${params.toString()}`, { cache: 'no-store' });
      const data = res.ok ? await res.json() : null;
      if (data?.items?.length) {
        // Prefer exact email match; else first item
        const exact = data.items.find((it: any) => (it.email || '').toLowerCase() === q.toLowerCase());
        const pick = exact || data.items[0];
        setCompany(pick.company || '');
      } else {
        setCompany('');
      }
    } catch {
      setCompany('');
    }
  }

  const canSubmit = useMemo(() => {
    return leaveType && startDate && endDate && reason && employee;
  }, [leaveType, startDate, endDate, reason, employee]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      // last attempt to resolve company (in case not yet resolved)
      if (!company) {
        await resolveCompanyForEmployee(employee);
      }

      const res = await fetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Leave_Type: leaveType,
          Leave_Start_Date: startDate,
          Leave_End_Date: endDate,
          Reson: reason,
          added_by_user: employee,
          // hidden field value; server will also resolve from DB as source of truth
          client_company_name: company || undefined
        })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to submit leave');
      }
      router.push('/pages/hr/leaves/available');
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6">
      <SidebarConfig role="hr" />
      <div className="mx-auto max-w-4xl space-y-6">
        <Card className="border-muted/50 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/70">
          <CardHeader className="pb-4">
            <CardTitle>New Leave Request</CardTitle>
            <CardDescription>Capture the leave details and submit to notify the HR team.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error ? (
              <Alert variant="destructive" className="border-destructive/50">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

         
            <form onSubmit={onSubmit} className="space-y-6 max-w-3xl mx-auto">
      
      {/* --- HIDDEN DATA SECTION --- */}
      {/* This section holds data for the form submission but stays out of the layout */}
      <div className="hidden">
        <Input
          id="employee"
          value={employee}
          onChange={(e) => setEmployee(e.target.value)}
          onBlur={() => resolveCompanyForEmployee(employee)}
          readOnly={!!company}
        />
        <input type="hidden" name="client_company_name" value={company} readOnly />
      </div>

      {/* --- VISIBLE FORM SECTION --- */}
      
      {/* Row 1: Leave Type (Full Width) */}
      <div className="space-y-2">
        <Label htmlFor="leave_type" className="font-medium text-slate-700">
          Leave Type
        </Label>
        <Select value={leaveType} onValueChange={setLeaveType}>
          <SelectTrigger id="leave_type" className="h-10 w-full">
            <SelectValue placeholder="Select the type of leave" />
          </SelectTrigger>
          <SelectContent>
            {leaveOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Row 2: Start / End Dates (Responsive Grid) */}
      {/* Row 2: Start / End Dates (Responsive Grid) */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="leave_start" className="font-medium text-slate-700">
            Start Date
          </Label>
          <DatePicker
            id="leave_start"
            placeholder="Select start date"
            value={fromYMD(startDate)}
            onChange={(d) => setStartDate(toYMD(d))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="leave_end" className="font-medium text-slate-700">
            End Date
          </Label>
          <DatePicker
            id="leave_end"
            placeholder="Select end date"
            value={fromYMD(endDate)}
            onChange={(d) => setEndDate(toYMD(d))}
          />
        </div>
      </div>

      {/* Row 3: Reason (Full Width) */}
      <div className="space-y-2">
        <Label htmlFor="leave_reason" className="font-medium text-slate-700">
          Reason for Leave
        </Label>
        <Textarea
          id="leave_reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Please provide details about your leave request..."
          className="min-h-[120px] resize-none"
          required
        />
        <p className="text-xs text-slate-500">
          Include any necessary context for your manager.
        </p>
      </div>

      {/* Row 4: Action Buttons */}
      <CardFooter className="flex flex-col gap-3 px-0 pt-4 sm:flex-row sm:justify-end">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => router.push('/pages/hr/leaves/available')}
          className="w-full sm:w-28"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={submitting || !canSubmit}
          className="w-full sm:w-auto px-8 bg-primary text-white"
        >
          {submitting ? 'Submitting...' : 'Submit Request'}
        </Button>
      </CardFooter>
      
    </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}