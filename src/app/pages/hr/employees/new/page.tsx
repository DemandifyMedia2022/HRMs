'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SidebarConfig } from '@/components/sidebar-config';
import { DatePicker } from '@/components/ui/date-picker';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff } from 'lucide-react';


export default function AddEmployeePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [optLoading, setOptLoading] = useState(false);
  const [optError, setOptError] = useState<string | null>(null);
  const [deptOptions, setDeptOptions] = useState<string[]>([]);
  const [buOptions, setBuOptions] = useState<string[]>([]);
  const [prefix, setPrefix] = useState('');
  const [gender, setGender] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const [employmentStatus, setEmploymentStatus] = useState('');
  const [company, setCompany] = useState('');
  const [businessUnit, setBusinessUnit] = useState('');
  const [department, setDepartment] = useState('');
  const [roleType, setRoleType] = useState('');
  const [joinDate, setJoinDate] = useState<Date | undefined>(undefined);
  const [dobDate, setDobDate] = useState<Date | undefined>(undefined);
  const [retirementDate, setRetirementDate] = useState<Date | undefined>(undefined);
  const [showPassword, setShowPassword] = useState(false);

  function formatDateISO(d?: Date) {
    if (!d) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  }

  useEffect(() => {
    let abort = false;
    async function loadOptions() {
      setOptLoading(true);
      setOptError(null);
      try {
        const deptSet = new Set<string>();
        const buSet = new Set<string>();
        // The API caps pageSize at 50; iterate pages to collect more
        const maxPages = 10;
        for (let p = 1; p <= maxPages; p++) {
          const res = await fetch(`/api/hr/settlement/users?page=${p}&pageSize=50`, { cache: 'no-store' });
          const j = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(j?.error || 'Failed to load options');
          const list: any[] = Array.isArray(j?.data) ? j.data : [];
          for (const u of list) {
            const d = (u?.department ?? '').toString().trim();
            if (d) deptSet.add(d);
            const bu = (u?.Business_unit ?? u?.business_unit ?? '').toString().trim();
            if (bu) buSet.add(bu);
          }
          const totalPages = Number(j?.pagination?.totalPages || 1);
          if (p >= totalPages) break;
          if (abort) break;
        }
        if (!abort) {
          const deptArr = [...deptSet.values()].sort();
          const buArr = [...buSet.values()].sort();
          setDeptOptions(deptArr);
          // Fallback: if no explicit Business Unit values, use departments for BU dropdown
          setBuOptions(buArr.length > 0 ? buArr : deptArr);
        }
      } catch (e: any) {
        if (!abort) setOptError(e?.message || 'Failed to load dropdown options');
      } finally {
        if (!abort) setOptLoading(false);
      }
    }
    loadOptions();
    return () => {
      abort = true;
    };
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const form = e.currentTarget;
    const fd = new FormData(form);

    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        body: fd
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || 'Failed to add employee');
      }
      setSuccess('Employee created successfully');
      // navigate back to HR home or details
      setTimeout(() => {
        router.push('/pages/hr');
      }, 800);
    } catch (e: any) {
      setError(e?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <SidebarConfig role="hr" />
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Add Employee</CardTitle>
            <CardDescription>
              Fill all required details. Fields marked with
              {' '}<span style={{ color: 'lab(37.963% .55404 -46.454)' }}>*</span> are mandatory.
            </CardDescription>
          </CardHeader>
          <form onSubmit={onSubmit} encType="multipart/form-data">
            <CardContent className="space-y-6">
              {error && <div className="text-sm text-destructive">{error}</div>}
              {success && <div className="text-sm text-green-600">{success}</div>}
              <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="join_date">Join Date <span style={{ color: 'lab(37.963% .55404 -46.454)' }}>*</span></Label>
              <DatePicker
                id="join_date_picker"
                placeholder="Select date"
                value={joinDate}
                onChange={setJoinDate}
                triggerClassName="w-full justify-between"
              />
              <input type="hidden" name="join_date" value={formatDateISO(joinDate)} required />
            </div>
            <div>
              <Label>Prefix <span style={{ color: 'lab(37.963% .55404 -46.454)' }}>*</span></Label>
              <Select value={prefix} onValueChange={setPrefix}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mr.">Mr.</SelectItem>
                  <SelectItem value="Ms.">Ms.</SelectItem>
                  <SelectItem value="Mrs.">Mrs.</SelectItem>
                  <SelectItem value="Dr.">Dr.</SelectItem>
                  <SelectItem value="Prof.">Prof.</SelectItem>
                </SelectContent>
              </Select>
              <input type="hidden" name="Prefix" value={prefix} required />
            </div>
            <div>
              <Label htmlFor="name">Name <span style={{ color: 'lab(37.963% .55404 -46.454)' }}>*</span></Label>
              <Input id="name" name="name" required />
            </div>
            <div>
              <Label htmlFor="full_name">Full Name <span style={{ color: 'lab(37.963% .55404 -46.454)' }}>*</span></Label>
              <Input id="full_name" name="full_name" required />
            </div>
            <div>
              <Label>Gender <span style={{ color: 'lab(37.963% .55404 -46.454)' }}>*</span></Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              <input type="hidden" name="gender" value={gender} required />
            </div>
            <div>
              <Label htmlFor="emp_code">Employee Code <span style={{ color: 'lab(37.963% .55404 -46.454)' }}>*</span></Label>
              <Input id="emp_code" name="emp_code" required />
            </div>
            <div>
              <Label>Blood Group <span style={{ color: 'lab(37.963% .55404 -46.454)' }}>*</span></Label>
              <Select value={bloodGroup} onValueChange={setBloodGroup}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A+">A+</SelectItem>
                  <SelectItem value="A-">A-</SelectItem>
                  <SelectItem value="B+">B+</SelectItem>
                  <SelectItem value="B-">B-</SelectItem>
                  <SelectItem value="AB+">AB+</SelectItem>
                  <SelectItem value="AB-">AB-</SelectItem>
                  <SelectItem value="O+">O+</SelectItem>
                  <SelectItem value="O-">O-</SelectItem>
                </SelectContent>
              </Select>
              <input type="hidden" name="blood_group" value={bloodGroup} required />
            </div>
            <div>
              <Label htmlFor="nationality">Nationality <span style={{ color: 'lab(37.963% .55404 -46.454)' }}>*</span></Label>
              <Input id="nationality" name="nationality" required />
            </div>
            <div>
              <Label htmlFor="email">Email <span style={{ color: 'lab(37.963% .55404 -46.454)' }}>*</span></Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div>
              <Label htmlFor="personal_email">Personal Email <span style={{ color: 'lab(37.963% .55404 -46.454)' }}>*</span></Label>
              <Input id="personal_email" name="personal_email" type="email" required />
            </div>
            <div>
              <Label htmlFor="contact_no">Contact No <span style={{ color: 'lab(37.963% .55404 -46.454)' }}>*</span></Label>
              <Input id="contact_no" name="contact_no" required />
            </div>
            <div>
              <Label htmlFor="dob">DOB <span style={{ color: 'lab(37.963% .55404 -46.454)' }}>*</span></Label>
              <DatePicker
                id="dob_picker"
                placeholder="Select date"
                value={dobDate}
                onChange={setDobDate}
                triggerClassName="w-full justify-between"
              />
              <input type="hidden" name="dob" value={formatDateISO(dobDate)} required />
            </div>
            <div>
              <Label htmlFor="retirement_date">Retirement Date <span style={{ color: 'lab(37.963% .55404 -46.454)' }}>*</span></Label>
              <DatePicker
                id="retirement_date_picker"
                placeholder="Select date"
                value={retirementDate}
                onChange={setRetirementDate}
                triggerClassName="w-full justify-between"
              />
              <input type="hidden" name="retirement_date" value={formatDateISO(retirementDate)} required />
            </div>
            <div>
              <Label>Employment Type <span style={{ color: 'lab(37.963% .55404 -46.454)' }}>*</span></Label>
              <Select value={employmentType} onValueChange={setEmploymentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Consultant">Consultant</SelectItem>
                  <SelectItem value="Contractual">Contractual</SelectItem>
                  <SelectItem value="Permanent">Permanent</SelectItem>
                  <SelectItem value="Trainee">Trainee</SelectItem>
                  <SelectItem value="Wages">Wages</SelectItem>
                </SelectContent>
              </Select>
              <input type="hidden" name="employment_type" value={employmentType} required />
            </div>
            <div>
              <Label>Employment Status <span style={{ color: 'lab(37.963% .55404 -46.454)' }}>*</span></Label>
              <Select value={employmentStatus} onValueChange={setEmploymentStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Probation">Probation</SelectItem>
                  <SelectItem value="Confirmed">Confirmed</SelectItem>
                  <SelectItem value="Resigned">Resigned</SelectItem>
                  <SelectItem value="Relieved">Relieved</SelectItem>
                  <SelectItem value="Settled">Settled</SelectItem>
                </SelectContent>
              </Select>
              <input type="hidden" name="employment_status" value={employmentStatus} required />
            </div>
            <div>
              <Label>Company <span style={{ color: 'lab(37.963% .55404 -46.454)' }}>*</span></Label>
              <Select value={company} onValueChange={setCompany}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Demandify Media">Demandify Media</SelectItem>
                  <SelectItem value="Gnosis Dtata Marketing">Gnosis Dtata Marketing</SelectItem>
                </SelectContent>
              </Select>
              <input type="hidden" name="company" value={company} required />
            </div>
            <div>
              <Label>Business Unit <span style={{ color: 'lab(37.963% .55404 -46.454)' }}>*</span></Label>
              <Select value={businessUnit} onValueChange={setBusinessUnit}>
                <SelectTrigger disabled={optLoading}>
                  <SelectValue placeholder={optLoading ? 'Loading...' : 'Select'} />
                </SelectTrigger>
                <SelectContent>
                  {buOptions.map(bu => (
                    <SelectItem key={bu} value={bu}>
                      {bu}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="Business_unit" value={businessUnit} required />
              {optError ? <div className="text-xs text-red-600 mt-1">{optError}</div> : null}
            </div>
            <div>
              <Label htmlFor="job_role">Job Role <span style={{ color: 'lab(37.963% .55404 -46.454)' }}>*</span></Label>
              <Input id="job_role" name="job_role" required />
            </div>
            <div>
              <Label>Department <span style={{ color: 'lab(37.963% .55404 -46.454)' }}>*</span></Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger disabled={optLoading}>
                  <SelectValue placeholder={optLoading ? 'Loading...' : 'Select'} />
                </SelectTrigger>
                <SelectContent>
                  {deptOptions.map(d => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="department" value={department} required />
              {optError ? <div className="text-xs text-red-600 mt-1">{optError}</div> : null}
            </div>
            <div>
              <Label htmlFor="reporting_manager">Reporting Manager <span style={{ color: 'lab(37.963% .55404 -46.454)' }}>*</span></Label>
              <Input id="reporting_manager" name="reporting_manager" required />
            </div>
            <div>
              <Label htmlFor="Functional_manager">Functional Manager <span style={{ color: 'lab(37.963% .55404 -46.454)' }}>*</span></Label>
              <Input id="Functional_manager" name="Functional_manager" required />
            </div>
            <div className="md:col-span-3">
              <Label htmlFor="emp_address">Employee Address <span style={{ color: 'lab(37.963% .55404 -46.454)' }}>*</span></Label>
              <Textarea id="emp_address" name="emp_address" required />
            </div>
            <div>
              <Label>Role Type <span style={{ color: 'lab(37.963% .55404 -46.454)' }}>*</span></Label>
              <Select value={roleType} onValueChange={setRoleType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="HR">HR</SelectItem>
                  <SelectItem value="Quality">Quality</SelectItem>
                  <SelectItem value="IT">IT</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Sales">Sales</SelectItem>
                  <SelectItem value="Operation Agent">Operation Agent</SelectItem>
                </SelectContent>
              </Select>
              <input type="hidden" name="type" value={roleType} required />
            </div>
            <div>
              <Label htmlFor="password">Password <span style={{ color: 'lab(37.963% .55404 -46.454)' }}>*</span></Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute inset-y-0 right-0 h-full px-3 text-muted-foreground"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>
            </div>
              </section>
              <Separator />
              <div className="text-sm font-medium text-muted-foreground">Documents</div>
              <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="aadhaar_card">Aadhaar Card</Label>
              <Input id="aadhaar_card" name="aadhaar_card" type="file" accept="image/*,.pdf" className="w-full" />
            </div>
            <div>
              <Label htmlFor="pan_card">PAN Card</Label>
              <Input id="pan_card" name="pan_card" type="file" accept="image/*,.pdf" className="w-full" />
            </div>
            <div>
              <Label htmlFor="marksheet">Marksheet</Label>
              <Input id="marksheet" name="marksheet" type="file" accept="image/*,.pdf" className="w-full" />
            </div>
            <div>
              <Label htmlFor="certifications">Certifications</Label>
              <Input id="certifications" name="certifications" type="file" accept="image/*,.pdf" className="w-full" />
            </div>
            <div>
              <Label htmlFor="bankpassbook">Bank Passbook</Label>
              <Input id="bankpassbook" name="bankpassbook" type="file" accept="image/*,.pdf" className="w-full" />
            </div>
            <div>
              <Label htmlFor="relieving_letter">Relieving Letter</Label>
              <Input
                id="relieving_letter"
                name="relieving_letter"
                type="file"
                accept="image/*,.pdf"
                className="w-full"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="pay_slips">Pay Slips (multiple)</Label>
              <Input id="pay_slips" name="pay_slips" type="file" multiple accept="image/*,.pdf" className="w-full" />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="bank_statements">Bank Statements (multiple)</Label>
              <Input
                id="bank_statements"
                name="bank_statements"
                type="file"
                multiple
                accept="image/*,.pdf"
                className="w-full"
              />
            </div>
              </section>
            </CardContent>
            <CardFooter className="justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => router.push('/pages/hr')}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </>
  );
}