"use client"

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"

type User = {
  id: number
  Prefix?: string | null
  Full_name?: string | null
  name?: string | null
  emp_code?: string | null
  email?: string | null
  Personal_Email?: string | null
  contact_no?: string | null
  dob?: string | null
  gender?: string | null
  blood_group?: string | null
  nationality?: string | null
  Biometric_id?: string | null
  department?: string | null
  employment_status?: string | null
  employment_type?: string | null
  joining_date?: string | null
  retirement_date?: string | null
  company_name?: string | null
  Business_unit?: string | null
  job_role?: string | null
  reporting_manager?: string | null
  Functional_manager?: string | null
  // Family / other
  father_name?: string | null
  father_dob?: string | null
  mother_name?: string | null
  mother_dob?: string | null
  marital_status?: string | null
  bank_name?: string | null
  branch?: string | null
  IFSC_code?: string | null
  Account_no?: string | null
  UAN?: string | null
  salary_pay_mode?: string | null
  reimbursement_pay_mode?: string | null
  reimbursement_bank_name?: string | null
  reimbursement_branch?: string | null
  reimbursement_ifsc_code?: string | null
  reimbursement_account_no?: string | null
  pan_card_no?: string | null
  adhar_card_no?: string | null
  passport_no?: string | null
  passport_expiry_date?: string | null
  emergency_contact?: string | null
  emergency_contact_name?: string | null
  emergency_relation?: string | null
  insurance_company?: string | null
  assured_sum?: string | null
  insuree_name?: string | null
  relationship?: string | null
  insuree_dob?: string | null
  insuree_gender?: string | null
  insuree_code?: string | null
  // Documents
  aadhaar_card?: string | null
  pan_card?: string | null
  bankpassbook?: string | null
  relieving_letter?: string | null
  certifications?: string | null
  marksheet?: string | null
  pay_slips?: string | null
  bank_statement?: string | null
}

type ListResponse = { data: User[]; pagination?: { total: number } }

export default function EmployeeDetailsPage() {
  const [employeesAll, setEmployeesAll] = useState<User[]>([])
  const [employees, setEmployees] = useState<User[]>([])
  const [departments, setDepartments] = useState<string[]>([])
  const [search, setSearch] = useState("")
  const [deptFilter, setDeptFilter] = useState("All")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<User | null>(null)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState("basic")
  const [flash, setFlash] = useState<string | null>(null)
  const [pageNum, setPageNum] = useState(1)
  const pageSize = 6
  const [familyMarital, setFamilyMarital] = useState("")

  function toDateInput(v?: string | null) {
    if (!v) return ""
    const s = String(v)
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
    const d = new Date(s)
    if (isNaN(d.getTime())) return ""
    const yyyy = d.getUTCFullYear()
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0")
    const dd = String(d.getUTCDate()).padStart(2, "0")
    return `${yyyy}-${mm}-${dd}`
  }

  async function uploadDocuments(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selected) return
    const form = e.currentTarget
    const fd = new FormData(form)
    fd.append("employee_id", String(selected.id))
    try {
      setSaving(true)
      const res = await fetch("/api/hr/employees/update", { method: "POST", body: fd })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j?.error || "Failed to upload documents")
      setFlash("Documents uploaded successfully")
      setTimeout(() => setFlash(null), 2500)
      // Refresh selected with latest data
      const full = await fetch(`/api/hr/employees/${selected.id}`, { cache: "no-store" }).then((r) => r.json())
      setSelected((prev) => (prev ? { ...prev, ...full } : full))
      form.reset()
    } catch (err: any) {
      alert(err?.message || "Upload failed")
    } finally {
      setSaving(false)
    }
  }

  function parseArrayField(s?: string | null): string[] {
    if (!s) return []
    const trimmed = s.trim()
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const arr = JSON.parse(trimmed)
        return Array.isArray(arr) ? arr : []
      } catch {
        // fallthrough
      }
    }
    // If DB stored a single URL string (legacy), show it as one item
    if (/^\/?(?:uploads|employee_documents)\//.test(trimmed)) return [trimmed]
    return []
  }

  function docUrl(p?: string | null) {
    if (!p) return ""
    if (/^https?:\/\//i.test(p)) return p
    return p.startsWith("/") ? p : "/" + p
  }

  function hasDocStr(p?: string | null) {
    if (!p) return false
    const s = String(p).trim()
    if (!s) return false
    if (s.toLowerCase() === "null" || s.toLowerCase() === "undefined") return false
    return true
  }

  const qs = useMemo(() => {
    const p = new URLSearchParams()
    if (search) p.set("search", search)
    // Department filtering is client-side
    p.set("page", "1")
    p.set("pageSize", "200")
    return p.toString()
  }, [search])

  useEffect(() => {
    async function run() {
      setLoading(true)
      setError(null)
      try {
        // Reuse HR settlement users listing endpoint for users search
        const res = await fetch(`/api/hr/settlement/users?${qs}`, { cache: "no-store" })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || "Failed to load employees")
        const list = (json?.data || []) as User[]
        setEmployeesAll(list)
        // Build departments from the full list
        const depts = Array.from(new Set((list || []).map((u) => u.department || "").filter(Boolean))) as string[]
        setDepartments(["All", ...depts])
        // Apply current department filter on new data
        const filtered = deptFilter === "All" ? list : list.filter((u) => (u.department || "") === deptFilter)
        setEmployees(filtered)
        // If current selection not in filtered, adjust selection
        if (!selected || !filtered.find((u) => u.id === selected.id)) {
          setSelected(filtered[0] || null)
        }
        setPageNum(1)
      } catch (e: any) {
        setError(e?.message || "Failed to load employees")
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [qs])

  useEffect(() => {
    let abort = false
    async function loadFull() {
      if (!selected?.id) return
      try {
        const res = await fetch(`/api/hr/employees/${selected.id}`, { cache: "no-store" })
        if (!res.ok) return
        const full = await res.json()
        if (abort) return
        setSelected((prev) => (prev ? { ...prev, ...full } : full))
      } catch {}
    }
    loadFull()
    return () => { abort = true }
  }, [selected?.id])

  useEffect(() => {
    // Recompute client-side department filtering when deptFilter changes
    const filtered = deptFilter === "All" ? employeesAll : employeesAll.filter((u) => (u.department || "") === deptFilter)
    setEmployees(filtered)
    if (!selected || !filtered.find((u) => u.id === selected.id)) {
      setSelected(filtered[0] || null)
    }
    setPageNum(1)
  }, [deptFilter, employeesAll])

  // Keep family marital status state in sync with selected employee
  useEffect(() => {
    setFamilyMarital(selected?.marital_status || "")
  }, [selected?.id, selected?.marital_status])

  const totalPages = useMemo(() => Math.max(1, Math.ceil(employees.length / pageSize)), [employees.length])
  const pagedEmployees = useMemo(() => {
    const start = (pageNum - 1) * pageSize
    return employees.slice(start, start + pageSize)
  }, [employees, pageNum])

  function getInitials(u: User) {
    const n = (u.Full_name || u.name || "").trim()
    if (!n) return "--"
    const parts = n.split(/\s+/).filter(Boolean)
    const first = parts[0]?.[0] || ""
    const second = parts[1]?.[0] || ""
    return (first + second).toUpperCase() || first.toUpperCase() || "--"
  }

  function pickDisplayName(u: User) {
    return u.Full_name || u.name || "Unnamed"
  }

  async function saveSection(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selected) return
    const form = e.currentTarget
    const fd = new FormData(form)
    const data: any = {}
    fd.forEach((v, k) => {
      data[k] = v
    })
    try {
      setSaving(true)
      const res = await fetch("/api/hr/employees/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employee_id: selected.id, data }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j?.error || "Failed to save")
      setFlash("Saved successfully")
      setTimeout(() => setFlash(null), 2500)
    } catch (err: any) {
      alert(err?.message || "Save failed")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 border rounded p-4 space-y-3">
        <div className="text-xl font-semibold">Employees</div>
        <Input placeholder="Search name or code" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="flex gap-2 flex-wrap text-sm">
          {departments.length === 0 ? (
            <span className="text-gray-500">No departments</span>
          ) : (
            departments.map((d) => (
              <Button key={d} variant={deptFilter === d ? "default" : "outline"} onClick={() => setDeptFilter(d)} className="px-2 py-1 h-auto text-xs">
                {d}
              </Button>
            ))
          )}
        </div>
        <div className="max-h-[60vh] overflow-auto">
          {loading ? (
            <div className="p-2 text-sm">Loading...</div>
          ) : employees.length === 0 ? (
            <div className="p-2 text-sm">No employees</div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {pagedEmployees.map((u) => (
                  <Card
                    key={u.id}
                    onClick={() => setSelected(u)}
                    className={`w-full p-3 cursor-pointer hover:shadow-sm transition ${selected?.id === u.id ? "ring-2 ring-gray-900" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>{getInitials(u)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold flex items-center gap-2">
                          {pickDisplayName(u)}
                          {u.department ? <Badge variant="secondary" className="text-[10px]">{u.department}</Badge> : null}
                        </div>
                        <div className="text-xs text-gray-600">Employee Code: {u.emp_code || "-"}</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              <div className="flex items-center justify-between text-sm">
                <Button variant="outline" className="px-3 py-1 h-auto disabled:opacity-50" onClick={() => setPageNum((p) => Math.max(1, p - 1))} disabled={pageNum <= 1}>Prev</Button>
                <div>Page {pageNum} of {totalPages}</div>
                <Button variant="outline" className="px-3 py-1 h-auto disabled:opacity-50" onClick={() => setPageNum((p) => Math.min(totalPages, p + 1))} disabled={pageNum >= totalPages}>Next</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="lg:col-span-2 border rounded p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xl font-semibold">Employee Details</div>
          {flash ? <div className="text-sm px-3 py-1 rounded bg-green-100 text-green-700">{flash}</div> : null}
        </div>
        {!selected ? (
          <div className="text-sm text-gray-600">Select an employee to view details</div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap text-sm">
              {[
                ["basic", "Basic Info"],
                ["family", "Family"],
                ["employment", "Employment"],
                ["position", "Position"],
                ["bank", "Bank"],
                ["other", "Other"],
                ["insurance", "Health Insurance"],
                ["documents", "Documents"],
              ].map(([k, label]) => (
                <button key={k} onClick={() => setTab(String(k))} className={`px-2 py-1 rounded border ${tab === k ? "bg-gray-900 text-white" : ""}`}>{label}</button>
              ))}
            </div>

            {tab === "basic" && (
              <form key={`${selected.id}-basic`} className="grid grid-cols-1 sm:grid-cols-2 gap-3" onSubmit={saveSection}>
                <div className="space-y-1"><Label htmlFor="Prefix">Prefix</Label><Input id="Prefix" name="Prefix" defaultValue={selected.Prefix || ""} placeholder="Prefix" /></div>
                <div className="space-y-1"><Label htmlFor="Full_name">Full name</Label><Input id="Full_name" name="Full_name" defaultValue={selected.Full_name || selected.name || ""} placeholder="Full name" /></div>
                <div className="space-y-1"><Label htmlFor="emp_code">Emp code</Label><Input id="emp_code" name="emp_code" defaultValue={selected.emp_code || ""} placeholder="Emp code" /></div>
                <div className="space-y-1"><Label htmlFor="dob">DOB</Label><Input id="dob" type="date" name="dob" defaultValue={toDateInput(selected.dob)} /></div>
                <div className="space-y-1"><Label htmlFor="gender">Gender</Label><Input id="gender" name="gender" defaultValue={selected.gender || ""} placeholder="Gender" /></div>
                <div className="space-y-1"><Label htmlFor="blood_group">Blood group</Label><Input id="blood_group" name="blood_group" defaultValue={selected.blood_group || ""} placeholder="Blood group" /></div>
                <div className="space-y-1"><Label htmlFor="nationality">Nationality</Label><Input id="nationality" name="nationality" defaultValue={selected.nationality || ""} placeholder="Nationality" /></div>
                <div className="space-y-1"><Label htmlFor="email">Email</Label><Input id="email" name="email" defaultValue={selected.email || ""} placeholder="Email" /></div>
                <div className="space-y-1"><Label htmlFor="Personal_Email">Personal Email</Label><Input id="Personal_Email" name="Personal_Email" defaultValue={selected.Personal_Email || ""} placeholder="Personal Email" /></div>
                <div className="space-y-1"><Label htmlFor="contact_no">Contact no</Label><Input id="contact_no" name="contact_no" defaultValue={selected.contact_no || ""} placeholder="Contact no" /></div>
                <div className="space-y-1"><Label htmlFor="Biometric_id">Biometric ID</Label><Input id="Biometric_id" name="Biometric_id" defaultValue={selected.Biometric_id || ""} placeholder="Biometric ID" /></div>
                <div className="sm:col-span-2 flex justify-end"><Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Basic Info"}</Button></div>
              </form>
            )}

            {tab === "family" && (
              <form key={`${selected.id}-family`} className="grid grid-cols-1 sm:grid-cols-2 gap-3" onSubmit={saveSection}>
                <div className="space-y-1"><Label htmlFor="father_name">Father name</Label><Input id="father_name" name="father_name" defaultValue={selected.father_name || ""} placeholder="Father name" /></div>
                <div className="space-y-1"><Label htmlFor="father_dob">Father DOB</Label><Input id="father_dob" type="date" name="father_dob" defaultValue={toDateInput(selected.father_dob)} /></div>
                <div className="space-y-1"><Label htmlFor="mother_name">Mother name</Label><Input id="mother_name" name="mother_name" defaultValue={selected.mother_name || ""} placeholder="Mother name" /></div>
                <div className="space-y-1"><Label htmlFor="mother_dob">Mother DOB</Label><Input id="mother_dob" type="date" name="mother_dob" defaultValue={toDateInput(selected.mother_dob)} /></div>

                <div className="col-span-1 sm:col-span-2 text-sm font-semibold">Marital Status & Children Details</div>
                <div className="space-y-1"><Label htmlFor="marital_status">Marital status</Label><Input id="marital_status" name="marital_status" defaultValue={selected.marital_status || ""} placeholder="Marital status" onChange={(e) => setFamilyMarital(e.target.value)} /></div>
                <div className="hidden sm:block" />

                {/* {familyMarital.trim().toLowerCase() === "married" && (
                //   <>
                //     <div className="space-y-1"><Label htmlFor="child_name">Child name</Label><Input id="child_name" name="child_name" defaultValue={selected.child_name || ""} placeholder="Child name" /></div>
                //     <div className="space-y-1"><Label htmlFor="child_dob">Child DOB</Label><Input id="child_dob" type="date" name="child_dob" defaultValue={toDateInput(selected.child_dob)} /></div>
                //     <div className="space-y-1"><Label htmlFor="child_gender">Child gender</Label><Input id="child_gender" name="child_gender" defaultValue={selected.child_gender || ""} placeholder="Child gender" /></div>
                //     <div className="hidden sm:block" />
                //   </>
                )} */}

                <div className="col-span-1 sm:col-span-2 text-sm font-semibold mt-2">Other Dependent</div>
                <div className="space-y-1"><Label htmlFor="emergency_contact_name">Dependent name</Label><Input id="emergency_contact_name" name="emergency_contact_name" defaultValue={selected.emergency_contact_name || ""} placeholder="Dependent name" /></div>
                <div className="space-y-1"><Label htmlFor="emergency_relation">Relationship</Label><Input id="emergency_relation" name="emergency_relation" defaultValue={selected.emergency_relation || ""} placeholder="Relationship" /></div>
                <div className="space-y-1"><Label htmlFor="emergency_contact">Contact</Label><Input id="emergency_contact" name="emergency_contact" defaultValue={selected.emergency_contact || ""} placeholder="Contact" /></div>
                <div className="hidden sm:block" />

                <div className="col-span-1 sm:col-span-2 text-sm font-semibold mt-2">Nominee Details</div>
                <div className="space-y-1"><Label htmlFor="insuree_name">Nominee name</Label><Input id="insuree_name" name="insuree_name" defaultValue={selected.insuree_name || ""} placeholder="Nominee name" /></div>
                <div className="space-y-1"><Label htmlFor="relationship">Relationship</Label><Input id="relationship" name="relationship" defaultValue={selected.relationship || ""} placeholder="Relationship" /></div>
                <div className="space-y-1"><Label htmlFor="insuree_dob">Nominee DOB</Label><Input id="insuree_dob" type="date" name="insuree_dob" defaultValue={toDateInput(selected.insuree_dob)} /></div>
                <div className="space-y-1"><Label htmlFor="insuree_gender">Nominee gender</Label><Input id="insuree_gender" name="insuree_gender" defaultValue={selected.insuree_gender || ""} placeholder="Nominee gender" /></div>
                <div className="space-y-1"><Label htmlFor="insuree_code">Nominee code</Label><Input id="insuree_code" name="insuree_code" defaultValue={selected.insuree_code || ""} placeholder="Nominee code" /></div>
                <div className="hidden sm:block" />
                <div className="sm:col-span-2 flex justify-end"><Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Family"}</Button></div>
              </form>
            )}

            {tab === "employment" && (
              <form key={`${selected.id}-employment`} className="grid grid-cols-1 sm:grid-cols-2 gap-3" onSubmit={saveSection}>
                <div className="space-y-1"><Label htmlFor="department">Department</Label><Input id="department" name="department" defaultValue={selected.department || ""} placeholder="Department" /></div>
                <div className="space-y-1"><Label htmlFor="employment_status">Employment status</Label><Input id="employment_status" name="employment_status" defaultValue={selected.employment_status || ""} placeholder="Employment status" /></div>
                <div className="space-y-1"><Label htmlFor="employment_type">Employment type</Label><Input id="employment_type" name="employment_type" defaultValue={selected.employment_type || ""} placeholder="Employment type" /></div>
                <div className="space-y-1"><Label htmlFor="joining_date">Joining date</Label><Input id="joining_date" name="joining_date" defaultValue={selected.joining_date || ""} placeholder="YYYY-MM-DD" /></div>
                <div className="space-y-1"><Label htmlFor="retirement_date">Retirement date</Label><Input id="retirement_date" name="retirement_date" defaultValue={selected.retirement_date || ""} placeholder="YYYY-MM-DD" /></div>
                <div className="sm:col-span-2 flex justify-end"><Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Employment"}</Button></div>
              </form>
            )}

            {tab === "position" && (
              <form key={`${selected.id}-position`} className="grid grid-cols-1 sm:grid-cols-2 gap-3" onSubmit={saveSection}>
                <div className="space-y-1"><Label htmlFor="company_name">Company name</Label><Input id="company_name" name="company_name" defaultValue={selected.company_name || ""} placeholder="Company name" /></div>
                <div className="space-y-1"><Label htmlFor="Business_unit">Business unit</Label><Input id="Business_unit" name="Business_unit" defaultValue={selected.Business_unit || ""} placeholder="Business unit" /></div>
                <div className="space-y-1"><Label htmlFor="job_role">Job role</Label><Input id="job_role" name="job_role" defaultValue={selected.job_role || ""} placeholder="Job role" /></div>
                <div className="space-y-1"><Label htmlFor="reporting_manager">Reporting manager</Label><Input id="reporting_manager" name="reporting_manager" defaultValue={selected.reporting_manager || ""} placeholder="Reporting manager" /></div>
                <div className="space-y-1"><Label htmlFor="Functional_manager">Functional manager</Label><Input id="Functional_manager" name="Functional_manager" defaultValue={selected.Functional_manager || ""} placeholder="Functional manager" /></div>
                <div className="sm:col-span-2 flex justify-end"><Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Position"}</Button></div>
              </form>
            )}

            {tab === "bank" && (
              <form key={`${selected.id}-bank`} className="grid grid-cols-1 sm:grid-cols-2 gap-3" onSubmit={saveSection}>
                <div className="space-y-1"><Label htmlFor="salary_pay_mode">Salary pay mode</Label><Input id="salary_pay_mode" name="salary_pay_mode" defaultValue={selected.salary_pay_mode || ""} placeholder="Salary pay mode" /></div>
                <div className="space-y-1"><Label htmlFor="bank_name">Bank name</Label><Input id="bank_name" name="bank_name" defaultValue={selected.bank_name || ""} placeholder="Bank name" /></div>
                <div className="space-y-1"><Label htmlFor="branch">Branch</Label><Input id="branch" name="branch" defaultValue={selected.branch || ""} placeholder="Branch" /></div>
                <div className="space-y-1"><Label htmlFor="IFSC_code">IFSC code</Label><Input id="IFSC_code" name="IFSC_code" defaultValue={selected.IFSC_code || ""} placeholder="IFSC code" /></div>
                <div className="space-y-1"><Label htmlFor="Account_no">Account no</Label><Input id="Account_no" name="Account_no" defaultValue={selected.Account_no || ""} placeholder="Account no" /></div>
                <div className="space-y-1"><Label htmlFor="UAN">UAN</Label><Input id="UAN" name="UAN" defaultValue={selected.UAN || ""} placeholder="UAN" /></div>
                <div className="space-y-1"><Label htmlFor="reimbursement_pay_mode">Reimbursement pay mode</Label><Input id="reimbursement_pay_mode" name="reimbursement_pay_mode" defaultValue={selected.reimbursement_pay_mode || ""} placeholder="Reimbursement pay mode" /></div>
                <div className="space-y-1"><Label htmlFor="reimbursement_bank_name">Reimbursement bank name</Label><Input id="reimbursement_bank_name" name="reimbursement_bank_name" defaultValue={selected.reimbursement_bank_name || ""} placeholder="Reimbursement bank name" /></div>
                <div className="space-y-1"><Label htmlFor="reimbursement_branch">Reimbursement branch</Label><Input id="reimbursement_branch" name="reimbursement_branch" defaultValue={selected.reimbursement_branch || ""} placeholder="Reimbursement branch" /></div>
                <div className="space-y-1"><Label htmlFor="reimbursement_ifsc_code">Reimbursement IFSC code</Label><Input id="reimbursement_ifsc_code" name="reimbursement_ifsc_code" defaultValue={selected.reimbursement_ifsc_code || ""} placeholder="Reimbursement IFSC code" /></div>
                <div className="space-y-1"><Label htmlFor="reimbursement_account_no">Reimbursement account no</Label><Input id="reimbursement_account_no" name="reimbursement_account_no" defaultValue={selected.reimbursement_account_no || ""} placeholder="Reimbursement account no" /></div>
                <div className="sm:col-span-2 flex justify-end"><Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Bank"}</Button></div>
              </form>
            )}

            {tab === "other" && (
              <form key={`${selected.id}-other`} className="grid grid-cols-1 sm:grid-cols-2 gap-3" onSubmit={saveSection}>
                <div className="space-y-1"><Label htmlFor="pan_card_no">PAN card no</Label><Input id="pan_card_no" name="pan_card_no" defaultValue={selected.pan_card_no || ""} placeholder="PAN card no" /></div>
                <div className="space-y-1"><Label htmlFor="adhar_card_no">Aadhar card no</Label><Input id="adhar_card_no" name="adhar_card_no" defaultValue={selected.adhar_card_no || ""} placeholder="Aadhar card no" /></div>
                <div className="space-y-1"><Label htmlFor="passport_no">Passport no</Label><Input id="passport_no" name="passport_no" defaultValue={selected.passport_no || ""} placeholder="Passport no" /></div>
                <div className="space-y-1"><Label htmlFor="passport_expiry_date">Passport expiry date</Label><Input id="passport_expiry_date" type="date" name="passport_expiry_date" defaultValue={toDateInput(selected.passport_expiry_date)} /></div>
                <div className="space-y-1"><Label htmlFor="Personal_Email">Personal Email</Label><Input id="Personal_Email" name="Personal_Email" defaultValue={selected.Personal_Email || ""} placeholder="Personal Email" /></div>
                <div className="space-y-1"><Label htmlFor="emergency_contact">Emergency contact</Label><Input id="emergency_contact" name="emergency_contact" defaultValue={selected.emergency_contact || ""} placeholder="Emergency contact" /></div>
                <div className="space-y-1"><Label htmlFor="emergency_contact_name">Emergency contact name</Label><Input id="emergency_contact_name" name="emergency_contact_name" defaultValue={selected.emergency_contact_name || ""} placeholder="Emergency contact name" /></div>
                <div className="space-y-1"><Label htmlFor="emergency_relation">Emergency relation</Label><Input id="emergency_relation" name="emergency_relation" defaultValue={selected.emergency_relation || ""} placeholder="Emergency relation" /></div>
                <div className="sm:col-span-2 flex justify-end"><Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Other"}</Button></div>
              </form>
            )}

            {tab === "insurance" && (
              <form key={`${selected.id}-insurance`} className="grid grid-cols-1 sm:grid-cols-2 gap-3" onSubmit={saveSection}>
                <div className="space-y-1"><Label htmlFor="insurance_company">Insurance company</Label><Input id="insurance_company" name="insurance_company" defaultValue={selected.insurance_company || ""} placeholder="Insurance company" /></div>
                <div className="space-y-1"><Label htmlFor="assured_sum">Assured sum</Label><Input id="assured_sum" name="assured_sum" defaultValue={selected.assured_sum || ""} placeholder="Assured sum" /></div>
                <div className="space-y-1"><Label htmlFor="insuree_name">Insuree name</Label><Input id="insuree_name" name="insuree_name" defaultValue={selected.insuree_name || ""} placeholder="Insuree name" /></div>
                <div className="space-y-1"><Label htmlFor="relationship">Relationship</Label><Input id="relationship" name="relationship" defaultValue={selected.relationship || ""} placeholder="Relationship" /></div>
                <div className="space-y-1"><Label htmlFor="insuree_dob">Insuree DOB</Label><Input id="insuree_dob" type="date" name="insuree_dob" defaultValue={toDateInput(selected.insuree_dob)} /></div>
                <div className="space-y-1"><Label htmlFor="insuree_gender">Insuree gender</Label><Input id="insuree_gender" name="insuree_gender" defaultValue={selected.insuree_gender || ""} placeholder="Insuree gender" /></div>
                <div className="space-y-1"><Label htmlFor="insuree_code">Insuree code</Label><Input id="insuree_code" name="insuree_code" defaultValue={selected.insuree_code || ""} placeholder="Insuree code" /></div>
                <div className="sm:col-span-2 flex justify-end"><Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Insurance"}</Button></div>
              </form>
            )}

            {tab === "documents" && (
              <form key={`${selected.id}-documents`} className="space-y-4" onSubmit={uploadDocuments} encType="multipart/form-data">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium mb-1">Aadhaar Card</div>
                    <Input type="file" name="aadhaar_card" accept=".pdf,.jpg,.jpeg,.png" />
                    {hasDocStr(selected.aadhaar_card) ? (
                      <div className="mt-1">
                        <Button asChild variant="outline" size="sm">
                          <a href={docUrl(selected.aadhaar_card)} target="_blank">View Document</a>
                        </Button>
                      </div>
                    ) : <div className="text-xs text-gray-500 mt-1">No document uploaded</div>}
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-1">PAN Card</div>
                    <Input type="file" name="pan_card" accept=".pdf,.jpg,.jpeg,.png" />
                    {hasDocStr(selected.pan_card) ? (
                      <div className="mt-1">
                        <Button asChild variant="outline" size="sm">
                          <a href={docUrl(selected.pan_card)} target="_blank">View Document</a>
                        </Button>
                      </div>
                    ) : <div className="text-xs text-gray-500 mt-1">No document uploaded</div>}
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-1">Bank Passbook</div>
                    <Input type="file" name="bankpassbook" accept=".pdf,.jpg,.jpeg,.png" />
                    {hasDocStr(selected.bankpassbook) ? (
                      <div className="mt-1">
                        <Button asChild variant="outline" size="sm">
                          <a href={docUrl(selected.bankpassbook)} target="_blank">View Document</a>
                        </Button>
                      </div>
                    ) : <div className="text-xs text-gray-500 mt-1">No document uploaded</div>}
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-1">Relieving Letter</div>
                    <Input type="file" name="relieving_letter" accept=".pdf,.jpg,.jpeg,.png" />
                    {hasDocStr(selected.relieving_letter) ? (
                      <div className="mt-1">
                        <Button asChild variant="outline" size="sm">
                          <a href={docUrl(selected.relieving_letter)} target="_blank">View Document</a>
                        </Button>
                      </div>
                    ) : <div className="text-xs text-gray-500 mt-1">No document uploaded</div>}
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-1">Certifications</div>
                    <Input type="file" name="certifications" accept=".pdf,.jpg,.jpeg,.png" />
                    {hasDocStr(selected.certifications) ? (
                      <div className="mt-1">
                        <Button asChild variant="outline" size="sm">
                          <a href={docUrl(selected.certifications)} target="_blank">View Document</a>
                        </Button>
                      </div>
                    ) : <div className="text-xs text-gray-500 mt-1">No document uploaded</div>}
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-1">Marksheet</div>
                    <Input type="file" name="marksheet" accept=".pdf,.jpg,.jpeg,.png" />
                    {hasDocStr(selected.marksheet) ? (
                      <div className="mt-1">
                        <Button asChild variant="outline" size="sm">
                          <a href={docUrl(selected.marksheet)} target="_blank">View Document</a>
                        </Button>
                      </div>
                    ) : <div className="text-xs text-gray-500 mt-1">No document uploaded</div>}
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-1">Pay Slips</div>
                    <Input type="file" name="pay_slips" accept=".pdf,.jpg,.jpeg,.png" multiple />
                    {parseArrayField(selected.pay_slips).length ? (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {parseArrayField(selected.pay_slips).map((u, i) => (
                          <Button key={i} asChild variant="outline" size="sm">
                            <a href={docUrl(u)} target="_blank">Slip {i + 1}</a>
                          </Button>
                        ))}
                      </div>
                    ) : <div className="text-xs text-gray-500 mt-1">No documents uploaded</div>}
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-1">Bank Statements</div>
                    <Input type="file" name="bank_statements" accept=".pdf,.jpg,.jpeg,.png" multiple />
                    {parseArrayField(selected.bank_statement).length ? (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {parseArrayField(selected.bank_statement).map((u, i) => (
                          <Button key={i} asChild variant="outline" size="sm">
                            <a href={docUrl(u)} target="_blank">Statement {i + 1}</a>
                          </Button>
                        ))}
                      </div>
                    ) : <div className="text-xs text-gray-500 mt-1">No documents uploaded</div>}
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={saving}>{saving ? "Uploading..." : "Upload Documents"}</Button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
