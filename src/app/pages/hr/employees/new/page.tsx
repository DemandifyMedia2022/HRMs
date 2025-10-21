"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AddEmployeePage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [optLoading, setOptLoading] = useState(false)
  const [optError, setOptError] = useState<string | null>(null)
  const [deptOptions, setDeptOptions] = useState<string[]>([])
  const [buOptions, setBuOptions] = useState<string[]>([])

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
            <label className="block text-sm mb-1">Join Date</label>
            <input name="join_date" type="date" className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">Prefix</label>
            <select name="Prefix" className="w-full border rounded px-3 py-2">
              <option value="">Select</option>
              <option value="Mr.">Mr.</option>
              <option value="Ms.">Ms.</option>
              <option value="Mrs.">Mrs.</option>
              <option value="Dr.">Dr.</option>
              <option value="Prof.">Prof.</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Name</label>
            <input name="name" required className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">Full Name</label>
            <input name="full_name" className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">Gender</label>
            <select name="gender" className="w-full border rounded px-3 py-2">
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Employee Code</label>
            <input name="emp_code" className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">Blood Group</label>
            <select name="blood_group" className="w-full border rounded px-3 py-2">
              <option value="">Select</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Nationality</label>
            <input name="nationality" className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input name="email" type="email" required className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">Personal Email</label>
            <input name="personal_email" type="email" className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">Contact No</label>
            <input name="contact_no" className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">DOB</label>
            <input name="dob" type="date" className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">Retirement Date</label>
            <input name="retirement_date" type="date" className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">Employment Type</label>
            <select name="employment_type" className="w-full border rounded px-3 py-2">
              <option value="">Select</option>
              <option value="Consultant">Consultant</option>
              <option value="Contractual">Contractual</option>
              <option value="Permanent">Permanent</option>
              <option value="Trainee">Trainee</option>
              <option value="Wages">Wages</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Employment Status</label>
            <select name="employment_status" className="w-full border rounded px-3 py-2">
              <option value="">Select</option>
              <option value="Probation">Probation</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Resigned">Resigned</option>
              <option value="Relieved">Relieved</option>
              <option value="Settled">Settled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Company</label>
            <select name="company" className="w-full border rounded px-3 py-2">
              <option value="">Select</option>
              <option value="Demandify Media">Demandify Media</option>
              <option value="Gnosis Dtata Marketing">Gnosis Dtata Marketing</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Business Unit</label>
            <select name="Business_unit" className="w-full border rounded px-3 py-2" disabled={optLoading}>
              <option value="">{optLoading ? "Loading..." : "Select"}</option>
              {buOptions.map((bu) => (
                <option key={bu} value={bu}>{bu}</option>
              ))}
            </select>
            {optError ? <div className="text-xs text-red-600 mt-1">{optError}</div> : null}
          </div>
          <div>
            <label className="block text-sm mb-1">Job Role</label>
            <input name="job_role" className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">Department</label>
            <select name="department" className="w-full border rounded px-3 py-2" disabled={optLoading}>
              <option value="">{optLoading ? "Loading..." : "Select"}</option>
              {deptOptions.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            {optError ? <div className="text-xs text-red-600 mt-1">{optError}</div> : null}
          </div>
          <div>
            <label className="block text-sm mb-1">Reporting Manager</label>
            <input name="reporting_manager" className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">Functional Manager</label>
            <input name="Functional_manager" className="w-full border rounded px-3 py-2" />
          </div>
          <div className="md:col-span-3">
            <label className="block text-sm mb-1">Employee Address</label>
            <textarea name="emp_address" className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">Role Type</label>
            <select name="type" className="w-full border rounded px-3 py-2">
              <option value="">Select</option>
              <option value="Manager">Manager</option>
              <option value="HR">HR</option>
              <option value="Quality">Quality</option>
              <option value="IT">IT</option>
              <option value="Marketing">Marketing</option>
              <option value="Sales">Sales</option>
              <option value="Operation Agent">Operation Agent</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Password</label>
            <input name="password" type="password" required className="w-full border rounded px-3 py-2" />
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Aadhaar Card</label>
            <input name="aadhaar_card" type="file" accept="image/*,.pdf" className="w-full" />
          </div>
          <div>
            <label className="block text-sm mb-1">PAN Card</label>
            <input name="pan_card" type="file" accept="image/*,.pdf" className="w-full" />
          </div>
          <div>
            <label className="block text-sm mb-1">Marksheet</label>
            <input name="marksheet" type="file" accept="image/*,.pdf" className="w-full" />
          </div>
          <div>
            <label className="block text-sm mb-1">Certifications</label>
            <input name="certifications" type="file" accept="image/*,.pdf" className="w-full" />
          </div>
          <div>
            <label className="block text-sm mb-1">Bank Passbook</label>
            <input name="bankpassbook" type="file" accept="image/*,.pdf" className="w-full" />
          </div>
          <div>
            <label className="block text-sm mb-1">Relieving Letter</label>
            <input name="relieving_letter" type="file" accept="image/*,.pdf" className="w-full" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Pay Slips (multiple)</label>
            <input name="pay_slips" type="file" multiple accept="image/*,.pdf" className="w-full" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Bank Statements (multiple)</label>
            <input name="bank_statements" type="file" multiple accept="image/*,.pdf" className="w-full" />
          </div>
        </section>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/pages/hr")}
            className="inline-flex items-center justify-center rounded border px-4 py-2"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}