"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function AddEmployeePage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [optLoading, setOptLoading] = useState(false)
  const [optError, setOptError] = useState<string | null>(null)
  const [deptOptions, setDeptOptions] = useState<string[]>([])
  const [buOptions, setBuOptions] = useState<string[]>([])
  const [prefix, setPrefix] = useState("")
  const [gender, setGender] = useState("")
  const [bloodGroup, setBloodGroup] = useState("")
  const [employmentType, setEmploymentType] = useState("")
  const [employmentStatus, setEmploymentStatus] = useState("")
  const [company, setCompany] = useState("")
  const [businessUnit, setBusinessUnit] = useState("")
  const [department, setDepartment] = useState("")
  const [roleType, setRoleType] = useState("")

  useEffect(() => {
    let abort = false
    async function loadOptions() {
      setOptLoading(true)
      setOptError(null)
      try {
        const deptSet = new Set<string>()
        const buSet = new Set<string>()
        // The API caps pageSize at 50; iterate pages to collect more
        const maxPages = 10
        for (let p = 1; p <= maxPages; p++) {
          const res = await fetch(`/api/hr/settlement/users?page=${p}&pageSize=50`, { cache: "no-store" })
          const j = await res.json().catch(() => ({}))
          if (!res.ok) throw new Error(j?.error || "Failed to load options")
          const list: any[] = Array.isArray(j?.data) ? j.data : []
          for (const u of list) {
            const d = (u?.department ?? "").toString().trim()
            if (d) deptSet.add(d)
            const bu = (u?.Business_unit ?? u?.business_unit ?? "").toString().trim()
            if (bu) buSet.add(bu)
          }
          const totalPages = Number(j?.pagination?.totalPages || 1)
          if (p >= totalPages) break
          if (abort) break
        }
        if (!abort) {
          const deptArr = [...deptSet.values()].sort()
          const buArr = [...buSet.values()].sort()
          setDeptOptions(deptArr)
          // Fallback: if no explicit Business Unit values, use departments for BU dropdown
          setBuOptions(buArr.length > 0 ? buArr : deptArr)
        }
      } catch (e: any) {
        if (!abort) setOptError(e?.message || "Failed to load dropdown options")
      } finally {
        if (!abort) setOptLoading(false)
      }
    }
    loadOptions()
    return () => { abort = true }
  }, [])

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccess(null)

    const form = e.currentTarget
    const fd = new FormData(form)

    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        body: fd,
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(json?.error || "Failed to add employee")
      }
      setSuccess("Employee created successfully")
      // navigate back to HR home or details
      setTimeout(() => {
        router.push("/pages/hr")
      }, 800)
    } catch (e: any) {
      setError(e?.message || "Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Add Employee</h1>
      {error && <div className="text-sm text-red-600">{error}</div>}
      {success && <div className="text-sm text-green-600">{success}</div>}
      <form onSubmit={onSubmit} className="space-y-6" encType="multipart/form-data">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="join_date">Join Date</Label>
            <Input id="join_date" name="join_date" type="date" />
          </div>
          <div>
            <Label>Prefix</Label>
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
            <input type="hidden" name="Prefix" value={prefix} />
          </div>
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required />
          </div>
          <div>
            <Label htmlFor="full_name">Full Name</Label>
            <Input id="full_name" name="full_name" />
          </div>
          <div>
            <Label>Gender</Label>
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
            <input type="hidden" name="gender" value={gender} />
          </div>
          <div>
            <Label htmlFor="emp_code">Employee Code</Label>
            <Input id="emp_code" name="emp_code" />
          </div>
          <div>
            <Label>Blood Group</Label>
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
            <input type="hidden" name="blood_group" value={bloodGroup} />
          </div>
          <div>
            <Label htmlFor="nationality">Nationality</Label>
            <Input id="nationality" name="nationality" />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div>
            <Label htmlFor="personal_email">Personal Email</Label>
            <Input id="personal_email" name="personal_email" type="email" />
          </div>
          <div>
            <Label htmlFor="contact_no">Contact No</Label>
            <Input id="contact_no" name="contact_no" />
          </div>
          <div>
            <Label htmlFor="dob">DOB</Label>
            <Input id="dob" name="dob" type="date" />
          </div>
          <div>
            <Label htmlFor="retirement_date">Retirement Date</Label>
            <Input id="retirement_date" name="retirement_date" type="date" />
          </div>
          <div>
            <Label>Employment Type</Label>
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
            <input type="hidden" name="employment_type" value={employmentType} />
          </div>
          <div>
            <Label>Employment Status</Label>
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
            <input type="hidden" name="employment_status" value={employmentStatus} />
          </div>
          <div>
            <Label>Company</Label>
            <Select value={company} onValueChange={setCompany}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Demandify Media">Demandify Media</SelectItem>
                <SelectItem value="Gnosis Dtata Marketing">Gnosis Dtata Marketing</SelectItem>
              </SelectContent>
            </Select>
            <input type="hidden" name="company" value={company} />
          </div>
          <div>
            <Label>Business Unit</Label>
            <Select value={businessUnit} onValueChange={setBusinessUnit}>
              <SelectTrigger disabled={optLoading}>
                <SelectValue placeholder={optLoading ? "Loading..." : "Select"} />
              </SelectTrigger>
              <SelectContent>
                {buOptions.map((bu) => (
                  <SelectItem key={bu} value={bu}>{bu}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" name="Business_unit" value={businessUnit} />
            {optError ? <div className="text-xs text-red-600 mt-1">{optError}</div> : null}
          </div>
          <div>
            <Label htmlFor="job_role">Job Role</Label>
            <Input id="job_role" name="job_role" />
          </div>
          <div>
            <Label>Department</Label>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger disabled={optLoading}>
                <SelectValue placeholder={optLoading ? "Loading..." : "Select"} />
              </SelectTrigger>
              <SelectContent>
                {deptOptions.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" name="department" value={department} />
            {optError ? <div className="text-xs text-red-600 mt-1">{optError}</div> : null}
          </div>
          <div>
            <Label htmlFor="reporting_manager">Reporting Manager</Label>
            <Input id="reporting_manager" name="reporting_manager" />
          </div>
          <div>
            <Label htmlFor="Functional_manager">Functional Manager</Label>
            <Input id="Functional_manager" name="Functional_manager" />
          </div>
          <div className="md:col-span-3">
            <Label htmlFor="emp_address">Employee Address</Label>
            <Textarea id="emp_address" name="emp_address" />
          </div>
          <div>
            <Label>Role Type</Label>
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
            <input type="hidden" name="type" value={roleType} />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required />
          </div>
        </section>

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
            <Input id="relieving_letter" name="relieving_letter" type="file" accept="image/*,.pdf" className="w-full" />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="pay_slips">Pay Slips (multiple)</Label>
            <Input id="pay_slips" name="pay_slips" type="file" multiple accept="image/*,.pdf" className="w-full" />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="bank_statements">Bank Statements (multiple)</Label>
            <Input id="bank_statements" name="bank_statements" type="file" multiple accept="image/*,.pdf" className="w-full" />
          </div>
        </section>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/pages/hr")}>Cancel</Button>
        </div>
      </form>
    </div>
  )
}