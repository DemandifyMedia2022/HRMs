'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarConfig } from '@/components/sidebar-config';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DatePicker } from '@/components/ui/date-picker';

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
  const [leaveType, setLeaveType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [addedByUser, setAddedByUser] = useState('');
  const [company, setCompany] = useState(''); // client_company_name
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await fetch('/api/users/me');
        if (res.ok) {
          const userData = await res.json();
          // Use Full_name if available, otherwise fall back to name
          const userName = userData.Full_name || userData.name || '';
          setAddedByUser(userName);
          
          // Also set the company if available
          if (userData.client_company_name) {
            setCompany(userData.client_company_name);
          }
        }
      } catch (err) {
        console.error('Failed to fetch current user:', err);
      }
    };

    fetchCurrentUser();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Leave_Type: leaveType,
          Leave_Start_Date: startDate,
          Leave_End_Date: endDate,
          Reson: reason,
          added_by_user: addedByUser,
          client_company_name: company // Send company name
        })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to submit leave');
      }
      router.push('/pages/user');
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6">
      <SidebarConfig role="user" />
      <div className="mx-auto max-w-4xl space-y-6">
        <Card className="border-muted/50 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/70">
          <CardHeader className="pb-4">
            <CardTitle>New Leave Request</CardTitle>
            <CardDescription>Capture the leave details and submit to notify HR team.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error ? (
              <Alert variant="destructive" className="border-destructive/50">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

                       <form onSubmit={onSubmit} className="space-y-6 max-w-3xl mx-auto">
              {/* Hidden field for company name */}
              <input type="hidden" name="client_company_name" value={company} readOnly />

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
                    {leaveOptions.map(option => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
      onChange={d => setStartDate(toYMD(d))}
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
      onChange={d => setEndDate(toYMD(d))}
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
                  onChange={e => setReason(e.target.value)}
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
                  onClick={() => router.back()}
                  className="w-full sm:w-28"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={submitting}
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

