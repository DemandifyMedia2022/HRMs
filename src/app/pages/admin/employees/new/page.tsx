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
import { Eye, EyeOff, UploadCloud, X } from 'lucide-react';

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
  const [jobRole, setJobRole] = useState('');
  const [jobRoleOptions, setJobRoleOptions] = useState<string[]>([]);
  const [jobRoleIsCustom, setJobRoleIsCustom] = useState(false);
  const [jobRoleCustom, setJobRoleCustom] = useState('');
  const [nationality, setNationality] = useState('');
  const [reportingManager, setReportingManager] = useState('');
  const [functionalManager, setFunctionalManager] = useState('');
  const [employeeOptions, setEmployeeOptions] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [employeeLoading, setEmployeeLoading] = useState(false);
  
  // File upload states
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);
  const [panFile, setPanFile] = useState<File | null>(null);
  const [marksheetFile, setMarksheetFile] = useState<File | null>(null);
  const [certificationsFile, setCertificationsFile] = useState<File | null>(null);
  const [bankPassbookFile, setBankPassbookFile] = useState<File | null>(null);
  const [relievingLetterFile, setRelievingLetterFile] = useState<File | null>(null);
  const [paySlipsFiles, setPaySlipsFiles] = useState<File[]>([]);
  const [bankStatementsFiles, setBankStatementsFiles] = useState<File[]>([]);

  function formatDateISO(d?: Date) {
    if (!d) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  }

  const departmentJobRoles: Record<string, string[]> = {
    Sales: ['Sales Development Representative', 'Business Development Representative', 'Account Manager', 'Account Director'],
    Development: ['Wordpress Developer', 'Frontend Developer', 'Full Stack Developer', 'Backend Developer'],
    HR: ['SR. Human Resource Executive', 'HR Executive', 'HR Manager', 'Finance Executive Intern'],
    Operation: ['Lead Generation Executive', 'Assistant Team Leader', 'Team Lead', 'Operations Manager', 'Appointment Generation', 'Data Analyst'],
    'Quality Analyst': ['Quality Head', 'Senior Quality Analyst', 'Quality Analyst'],
    Marketing: ['Digital Marketing Manager', 'SEO Executive', 'SR. Digital Marketing Executive', 'UI/UX Designer'],
    IT: ['IT Manager', 'IT Executive'],
    Administration: ['Admin'],
    CSM: ['Client Success Manager']
  };

  const nationalityOptions = [
    'Indian', 'American', 'British', 'Canadian', 'Australian', 'German', 'French', 'Japanese', 'Chinese',
    'Singaporean', 'Malaysian', 'UAE', 'Saudi Arabian', 'Qatari', 'Bangladeshi', 'Sri Lankan', 'Nepalese',
    'Pakistani', 'Other'
  ];

  useEffect(() => {
    if (department && departmentJobRoles[department]) {
      setJobRoleOptions(departmentJobRoles[department]);
    } else {
      setJobRoleOptions([]);
    }
    setJobRole('');
    setJobRoleIsCustom(false);
    setJobRoleCustom('');
  }, [department]);

  useEffect(() => {
    let abort = false;
    async function loadEmployees() {
      setEmployeeLoading(true);
      try {
        const res = await fetch(`/api/hr/settlement/users?page=1&pageSize=200`, { cache: 'no-store' });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error || 'Failed to load employees');
        const list: any[] = Array.isArray(json?.data) ? json.data : [];
        if (!abort) {
          const employees = list.map((u: any) => ({
            id: String(u.id || ''),
            name: (u.Full_name || u.name || u.email || '').toString().trim(),
            email: (u.email || '').toString().trim()
          })).filter(e => e.name || e.email);
          setEmployeeOptions(employees);
        }
      } catch (e: any) {
        if (!abort) console.error('Failed to load employees:', e);
      } finally {
        if (!abort) setEmployeeLoading(false);
      }
    }
    loadEmployees();
    return () => {
      abort = true;
    };
  }, []);

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
      // navigate back to admin home or details
      setTimeout(() => {
        router.push('/pages/admin');
      }, 800);
    } catch (e: any) {
      setError(e?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <SidebarConfig role="admin" />
      <div className="min-h-screen p-4 md:p-6 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Add Employee</CardTitle>
              <CardDescription>
                Fill all required details. Fields marked with <span className="text-red-500">*</span> are mandatory.
              </CardDescription>
            </CardHeader>
            <form onSubmit={onSubmit} encType="multipart/form-data">
              <CardContent className="space-y-6">
                {error && (
                  <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-900/20 p-4 text-sm text-green-700 dark:text-green-400">
                    {success}
                  </div>
                )}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="join_date">
                      Join Date <span className="text-red-500">*</span>
                    </Label>
                    <DatePicker
                      id="join_date_picker"
                      placeholder="Select date"
                      value={joinDate}
                      onChange={setJoinDate}
                      triggerClassName="w-full justify-between"
                    />
                    <input type="hidden" name="join_date" value={formatDateISO(joinDate)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Prefix <span className="text-red-500">*</span>
                    </Label>
                    <Select value={prefix} onValueChange={setPrefix}>
                      <SelectTrigger className="w-full">
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
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Name <span className="text-red-500">*</span>
                    </Label>
                    <Input id="name" name="name" required className="w-full" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="full_name">
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    <Input id="full_name" name="full_name" required className="w-full" />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Gender <span className="text-red-500">*</span>
                    </Label>
                    <Select value={gender} onValueChange={setGender}>
                      <SelectTrigger className="w-full">
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
                  <div className="space-y-2">
                    <Label htmlFor="emp_code">
                      Employee Code <span className="text-red-500">*</span>
                    </Label>
                    <Input id="emp_code" name="emp_code" required className="w-full" />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Blood Group <span className="text-red-500">*</span>
                    </Label>
                    <Select value={bloodGroup} onValueChange={setBloodGroup}>
                      <SelectTrigger className="w-full">
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
                  <div className="space-y-2">
                    <Label>
                      Nationality <span className="text-red-500">*</span>
                    </Label>
                    <Select value={nationality} onValueChange={setNationality}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {nationalityOptions.map(nat => (
                          <SelectItem key={nat} value={nat}>
                            {nat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <input type="hidden" name="nationality" value={nationality} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input id="email" name="email" type="email" required className="w-full" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="personal_email">
                      Personal Email <span className="text-red-500">*</span>
                    </Label>
                    <Input id="personal_email" name="personal_email" type="email" required className="w-full" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_no">
                      Contact No <span className="text-red-500">*</span>
                    </Label>
                    <Input id="contact_no" name="contact_no" required className="w-full" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dob">
                      DOB <span className="text-red-500">*</span>
                    </Label>
                    <DatePicker
                      id="dob_picker"
                      placeholder="Select date"
                      value={dobDate}
                      onChange={setDobDate}
                      triggerClassName="w-full justify-between"
                    />
                    <input type="hidden" name="dob" value={formatDateISO(dobDate)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="retirement_date">Retirement Date</Label>
                    <DatePicker
                      id="retirement_date_picker"
                      placeholder="Select date"
                      value={retirementDate}
                      onChange={setRetirementDate}
                      triggerClassName="w-full justify-between"
                    />
                    <input type="hidden" name="retirement_date" value={formatDateISO(retirementDate)} />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Employment Type <span className="text-red-500">*</span>
                    </Label>
                    <Select value={employmentType} onValueChange={setEmploymentType}>
                      <SelectTrigger className="w-full">
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
                  <div className="space-y-2">
                    <Label>
                      Employment Status <span className="text-red-500">*</span>
                    </Label>
                    <Select value={employmentStatus} onValueChange={setEmploymentStatus}>
                      <SelectTrigger className="w-full">
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
                  <div className="space-y-2">
                    <Label>
                      Company <span className="text-red-500">*</span>
                    </Label>
                    <Select value={company} onValueChange={setCompany}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Demandify Media">Demandify Media</SelectItem>
                        <SelectItem value="Gnosis Dtata Marketing">Gnosis Dtata Marketing</SelectItem>
                      </SelectContent>
                    </Select>
                    <input type="hidden" name="company" value={company} required />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Business Unit <span className="text-red-500">*</span>
                    </Label>
                    <Select value={businessUnit} onValueChange={setBusinessUnit}>
                      <SelectTrigger disabled={optLoading} className="w-full">
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
                    {optError && <div className="text-xs text-red-600 mt-1">{optError}</div>}
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Job Role <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={jobRoleIsCustom ? '__custom__' : jobRole}
                      onValueChange={(v) => {
                        if (v === '__custom__') {
                          setJobRoleIsCustom(true);
                          setJobRole('');
                        } else {
                          setJobRoleIsCustom(false);
                          setJobRoleCustom('');
                          setJobRole(v);
                        }
                      }}
                      disabled={!department}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={department ? 'Select Job Role or choose Custom' : 'Select Department first'} />
                      </SelectTrigger>
                      <SelectContent>
                        {jobRoleOptions.map(role => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                        <SelectItem value="__custom__">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    {jobRoleIsCustom && (
                      <div className="mt-2">
                        <Input
                          placeholder="Enter custom job role"
                          value={jobRoleCustom}
                          onChange={(e) => setJobRoleCustom(e.target.value)}
                          required
                          className="w-full"
                        />
                      </div>
                    )}
                    <input type="hidden" name="job_role" value={jobRoleIsCustom ? jobRoleCustom : jobRole} required />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Department <span className="text-red-500">*</span>
                    </Label>
                    <Select value={department} onValueChange={setDepartment}>
                      <SelectTrigger disabled={optLoading} className="w-full">
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
                    {optError && <div className="text-xs text-red-600 mt-1">{optError}</div>}
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Reporting Manager <span className="text-red-500">*</span>
                    </Label>
                    <Select value={reportingManager} onValueChange={setReportingManager} disabled={employeeLoading}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={employeeLoading ? 'Loading...' : 'Select Manager'} />
                      </SelectTrigger>
                      <SelectContent>
                        {employeeOptions.map(emp => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.name} {emp.email && `(${emp.email})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <input type="hidden" name="reporting_manager" value={reportingManager} required />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Functional Manager <span className="text-red-500">*</span>
                    </Label>
                    <Select value={functionalManager} onValueChange={setFunctionalManager} disabled={employeeLoading}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={employeeLoading ? 'Loading...' : 'Select Manager'} />
                      </SelectTrigger>
                      <SelectContent>
                        {employeeOptions.map(emp => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.name} {emp.email && `(${emp.email})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <input type="hidden" name="Functional_manager" value={functionalManager} required />
                  </div>
                  <div className="md:col-span-3 space-y-2">
                    <Label htmlFor="emp_address">
                      Employee Address <span className="text-red-500">*</span>
                    </Label>
                    <Textarea id="emp_address" name="emp_address" required className="w-full min-h-[100px]" />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Role Type <span className="text-red-500">*</span>
                    </Label>
                    <Select value={roleType} onValueChange={setRoleType}>
                      <SelectTrigger className="w-full">
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
                  <div className="space-y-2">
                    <Label htmlFor="password">
                      Password <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        className="w-full pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute inset-y-0 right-0 h-full px-3 text-muted-foreground hover:bg-transparent"
                        onClick={() => setShowPassword(v => !v)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </Button>
                    </div>
                  </div>
                </section>
                <Separator />
                <div className="text-sm font-medium text-muted-foreground mb-4">Documents</div>
                <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Aadhaar Card */}
                  <div className="space-y-2">
                    <Label>Aadhaar Card</Label>
                    <div className="border-2 border-dashed border-muted rounded-lg p-4 bg-background/50 hover:border-primary/60 transition-colors">
                      <input
                        type="file"
                        id="aadhaar_card"
                        name="aadhaar_card"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => setAadhaarFile(e.target.files?.[0] || null)}
                      />
                      <Label
                        htmlFor="aadhaar_card"
                        className="flex flex-col items-center justify-center gap-2 cursor-pointer"
                      >
                        <UploadCloud className="w-8 h-8 text-primary" />
                        <span className="text-sm text-center font-medium">
                          {aadhaarFile ? aadhaarFile.name : 'Click to upload or drag and drop'}
                        </span>
                        <span className="text-xs text-muted-foreground">PNG, JPG, PDF (max 5MB)</span>
                      </Label>
                      {aadhaarFile && (
                        <div className="flex items-center justify-center mt-2 gap-2">
                          <span className="text-xs text-muted-foreground truncate">{aadhaarFile.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => {
                              setAadhaarFile(null);
                              const input = document.getElementById('aadhaar_card') as HTMLInputElement;
                              if (input) input.value = '';
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* PAN Card */}
                  <div className="space-y-2">
                    <Label>PAN Card</Label>
                    <div className="border-2 border-dashed border-muted rounded-lg p-4 bg-background/50 hover:border-primary/60 transition-colors">
                      <input
                        type="file"
                        id="pan_card"
                        name="pan_card"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => setPanFile(e.target.files?.[0] || null)}
                      />
                      <Label
                        htmlFor="pan_card"
                        className="flex flex-col items-center justify-center gap-2 cursor-pointer"
                      >
                        <UploadCloud className="w-8 h-8 text-primary" />
                        <span className="text-sm text-center font-medium">
                          {panFile ? panFile.name : 'Click to upload or drag and drop'}
                        </span>
                        <span className="text-xs text-muted-foreground">PNG, JPG, PDF (max 5MB)</span>
                      </Label>
                      {panFile && (
                        <div className="flex items-center justify-center mt-2 gap-2">
                          <span className="text-xs text-muted-foreground truncate">{panFile.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => {
                              setPanFile(null);
                              const input = document.getElementById('pan_card') as HTMLInputElement;
                              if (input) input.value = '';
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Marksheet */}
                  <div className="space-y-2">
                    <Label>Marksheet</Label>
                    <div className="border-2 border-dashed border-muted rounded-lg p-4 bg-background/50 hover:border-primary/60 transition-colors">
                      <input
                        type="file"
                        id="marksheet"
                        name="marksheet"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => setMarksheetFile(e.target.files?.[0] || null)}
                      />
                      <Label
                        htmlFor="marksheet"
                        className="flex flex-col items-center justify-center gap-2 cursor-pointer"
                      >
                        <UploadCloud className="w-8 h-8 text-primary" />
                        <span className="text-sm text-center font-medium">
                          {marksheetFile ? marksheetFile.name : 'Click to upload or drag and drop'}
                        </span>
                        <span className="text-xs text-muted-foreground">PNG, JPG, PDF (max 5MB)</span>
                      </Label>
                      {marksheetFile && (
                        <div className="flex items-center justify-center mt-2 gap-2">
                          <span className="text-xs text-muted-foreground truncate">{marksheetFile.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => {
                              setMarksheetFile(null);
                              const input = document.getElementById('marksheet') as HTMLInputElement;
                              if (input) input.value = '';
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Certifications */}
                  <div className="space-y-2">
                    <Label>Certifications</Label>
                    <div className="border-2 border-dashed border-muted rounded-lg p-4 bg-background/50 hover:border-primary/60 transition-colors">
                      <input
                        type="file"
                        id="certifications"
                        name="certifications"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => setCertificationsFile(e.target.files?.[0] || null)}
                      />
                      <Label
                        htmlFor="certifications"
                        className="flex flex-col items-center justify-center gap-2 cursor-pointer"
                      >
                        <UploadCloud className="w-8 h-8 text-primary" />
                        <span className="text-sm text-center font-medium">
                          {certificationsFile ? certificationsFile.name : 'Click to upload or drag and drop'}
                        </span>
                        <span className="text-xs text-muted-foreground">PNG, JPG, PDF (max 5MB)</span>
                      </Label>
                      {certificationsFile && (
                        <div className="flex items-center justify-center mt-2 gap-2">
                          <span className="text-xs text-muted-foreground truncate">{certificationsFile.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => {
                              setCertificationsFile(null);
                              const input = document.getElementById('certifications') as HTMLInputElement;
                              if (input) input.value = '';
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bank Passbook */}
                  <div className="space-y-2">
                    <Label>Bank Passbook</Label>
                    <div className="border-2 border-dashed border-muted rounded-lg p-4 bg-background/50 hover:border-primary/60 transition-colors">
                      <input
                        type="file"
                        id="bankpassbook"
                        name="bankpassbook"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => setBankPassbookFile(e.target.files?.[0] || null)}
                      />
                      <Label
                        htmlFor="bankpassbook"
                        className="flex flex-col items-center justify-center gap-2 cursor-pointer"
                      >
                        <UploadCloud className="w-8 h-8 text-primary" />
                        <span className="text-sm text-center font-medium">
                          {bankPassbookFile ? bankPassbookFile.name : 'Click to upload or drag and drop'}
                        </span>
                        <span className="text-xs text-muted-foreground">PNG, JPG, PDF (max 5MB)</span>
                      </Label>
                      {bankPassbookFile && (
                        <div className="flex items-center justify-center mt-2 gap-2">
                          <span className="text-xs text-muted-foreground truncate">{bankPassbookFile.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => {
                              setBankPassbookFile(null);
                              const input = document.getElementById('bankpassbook') as HTMLInputElement;
                              if (input) input.value = '';
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Relieving Letter */}
                  <div className="space-y-2">
                    <Label>Relieving Letter</Label>
                    <div className="border-2 border-dashed border-muted rounded-lg p-4 bg-background/50 hover:border-primary/60 transition-colors">
                      <input
                        type="file"
                        id="relieving_letter"
                        name="relieving_letter"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => setRelievingLetterFile(e.target.files?.[0] || null)}
                      />
                      <Label
                        htmlFor="relieving_letter"
                        className="flex flex-col items-center justify-center gap-2 cursor-pointer"
                      >
                        <UploadCloud className="w-8 h-8 text-primary" />
                        <span className="text-sm text-center font-medium">
                          {relievingLetterFile ? relievingLetterFile.name : 'Click to upload or drag and drop'}
                        </span>
                        <span className="text-xs text-muted-foreground">PNG, JPG, PDF (max 5MB)</span>
                      </Label>
                      {relievingLetterFile && (
                        <div className="flex items-center justify-center mt-2 gap-2">
                          <span className="text-xs text-muted-foreground truncate">{relievingLetterFile.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => {
                              setRelievingLetterFile(null);
                              const input = document.getElementById('relieving_letter') as HTMLInputElement;
                              if (input) input.value = '';
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pay Slips (multiple) */}
                  <div className="md:col-span-2 space-y-2">
                    <Label>Pay Slips (multiple)</Label>
                    <div className="border-2 border-dashed border-muted rounded-lg p-4 bg-background/50 hover:border-primary/60 transition-colors">
                      <input
                        type="file"
                        id="pay_slips"
                        name="pay_slips"
                        multiple
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => setPaySlipsFiles(Array.from(e.target.files || []))}
                      />
                      <Label
                        htmlFor="pay_slips"
                        className="flex flex-col items-center justify-center gap-2 cursor-pointer"
                      >
                        <UploadCloud className="w-8 h-8 text-primary" />
                        <span className="text-sm text-center font-medium">
                          {paySlipsFiles.length > 0
                            ? `${paySlipsFiles.length} file(s) selected`
                            : 'Click to upload or drag and drop'}
                        </span>
                        <span className="text-xs text-muted-foreground">PNG, JPG, PDF (max 5MB each)</span>
                      </Label>
                      {paySlipsFiles.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {paySlipsFiles.map((file, idx) => (
                            <div key={idx} className="flex items-center justify-between gap-2 p-2 bg-muted rounded">
                              <span className="text-xs text-muted-foreground truncate flex-1">{file.name}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => {
                                  const newFiles = paySlipsFiles.filter((_, i) => i !== idx);
                                  setPaySlipsFiles(newFiles);
                                  const input = document.getElementById('pay_slips') as HTMLInputElement;
                                  if (input) {
                                    const dt = new DataTransfer();
                                    newFiles.forEach(file => dt.items.add(file));
                                    input.files = dt.files;
                                  }
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bank Statements (multiple) */}
                  <div className="md:col-span-2 space-y-2">
                    <Label>Bank Statements (multiple)</Label>
                    <div className="border-2 border-dashed border-muted rounded-lg p-4 bg-background/50 hover:border-primary/60 transition-colors">
                      <input
                        type="file"
                        id="bank_statements"
                        name="bank_statements"
                        multiple
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => setBankStatementsFiles(Array.from(e.target.files || []))}
                      />
                      <Label
                        htmlFor="bank_statements"
                        className="flex flex-col items-center justify-center gap-2 cursor-pointer"
                      >
                        <UploadCloud className="w-8 h-8 text-primary" />
                        <span className="text-sm text-center font-medium">
                          {bankStatementsFiles.length > 0
                            ? `${bankStatementsFiles.length} file(s) selected`
                            : 'Click to upload or drag and drop'}
                        </span>
                        <span className="text-xs text-muted-foreground">PNG, JPG, PDF (max 5MB each)</span>
                      </Label>
                      {bankStatementsFiles.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {bankStatementsFiles.map((file, idx) => (
                            <div key={idx} className="flex items-center justify-between gap-2 p-2 bg-muted rounded">
                              <span className="text-xs text-muted-foreground truncate flex-1">{file.name}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => {
                                  const newFiles = bankStatementsFiles.filter((_, i) => i !== idx);
                                  setBankStatementsFiles(newFiles);
                                  const input = document.getElementById('bank_statements') as HTMLInputElement;
                                  if (input) {
                                    const dt = new DataTransfer();
                                    newFiles.forEach(file => dt.items.add(file));
                                    input.files = dt.files;
                                  }
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              </CardContent>
              <CardFooter className="justify-end gap-3 border-t pt-6">
                <Button type="button" variant="outline" onClick={() => router.push('/pages/admin')}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}
