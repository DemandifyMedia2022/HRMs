"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DatePicker } from "@/components/ui/date-picker"

export default function AddEmployeePage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [joinDate, setJoinDate] = useState("")
  const [dob, setDob] = useState("")
  const [retirementDate, setRetirementDate] = useState("")

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
            {(() => {
              const toYMD = (d?: Date) => d ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` : "";
              const fromYMD = (s: string) => {
                if (!s) return undefined as unknown as Date | undefined;
                const [y,m,dd] = s.split('-').map((n) => parseInt(n,10));
                return new Date(y, (m||1)-1, dd||1);
              };
              return (
                <DatePicker
                  id="join_date"
                  placeholder="dd-mm-yyyy"
                  value={fromYMD(joinDate)}
                  onChange={(d) => setJoinDate(toYMD(d))}
                />
              )
            })()}
            <input type="hidden" name="join_date" value={joinDate} />
          </div>
          <div>
            <label className="block text-sm mb-1">Prefix</label>
            <input name="Prefix" className="w-full border rounded px-3 py-2" />
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
            <input name="blood_group" className="w-full border rounded px-3 py-2" />
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
            {(() => {
              const toYMD = (d?: Date) => d ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` : "";
              const fromYMD = (s: string) => {
                if (!s) return undefined as unknown as Date | undefined;
                const [y,m,dd] = s.split('-').map((n) => parseInt(n,10));
                return new Date(y, (m||1)-1, dd||1);
              };
              return (
                <DatePicker
                  id="dob"
                  placeholder="dd-mm-yyyy"
                  value={fromYMD(dob)}
                  onChange={(d) => setDob(toYMD(d))}
                />
              )
            })()}
            <input type="hidden" name="dob" value={dob} />
          </div>
          <div>
            <label className="block text-sm mb-1">Retirement Date</label>
            {(() => {
              const toYMD = (d?: Date) => d ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` : "";
              const fromYMD = (s: string) => {
                if (!s) return undefined as unknown as Date | undefined;
                const [y,m,dd] = s.split('-').map((n) => parseInt(n,10));
                return new Date(y, (m||1)-1, dd||1);
              };
              return (
                <DatePicker
                  id="retirement_date"
                  placeholder="dd-mm-yyyy"
                  value={fromYMD(retirementDate)}
                  onChange={(d) => setRetirementDate(toYMD(d))}
                />
              )
            })()}
            <input type="hidden" name="retirement_date" value={retirementDate} />
          </div>
          <div>
            <label className="block text-sm mb-1">Employment Type</label>
            <input name="employment_type" className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">Employment Status</label>
            <input name="employment_status" className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">Company</label>
            <input name="company" className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">Business Unit</label>
            <input name="Business_unit" className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">Job Role</label>
            <input name="job_role" className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">Department</label>
            <input name="department" className="w-full border rounded px-3 py-2" />
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
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="hr">HR</option>
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