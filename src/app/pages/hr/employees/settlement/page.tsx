"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"

type UserRow = {
  id: number
  name: string | null
  Full_name: string | null
  email: string | null
  emp_code: string | null
  department: string | null
  employment_status: string | null
  company_name: string | null
}

type PageResp = {
  data: UserRow[]
  pagination: { page: number; pageSize: number; total: number; totalPages: number }
}

export default function HREmployeeSettlementPage() {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [data, setData] = useState<UserRow[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [openId, setOpenId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    date_of_resignation: "",
    expected_last_working_day: "",
    date_of_relieving: "",
    resignation_reason_employee: "",
    resignation_reason_approver: "",
    employment_status: "",
    employee_other_status: "",
    employee_other_status_remarks: "",
  })

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (search.trim()) params.set("search", search.trim())
      params.set("page", String(page))
      params.set("pageSize", "10")
      const res = await fetch(`/api/hr/settlement/users?${params.toString()}`, { cache: "no-store" })
      const json = (await res.json()) as PageResp | any
      if (!res.ok) throw new Error(json?.error || "Failed to load users")
      setData((json as PageResp).data)
      setTotalPages((json as PageResp).pagination.totalPages)
    } catch (e: any) {
      setError(e?.message || "Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  function openArchive(u: UserRow) {
    setOpenId(u.id)
    setForm({
      date_of_resignation: "",
      expected_last_working_day: "",
      date_of_relieving: "",
      resignation_reason_employee: "",
      resignation_reason_approver: "",
      employment_status: u.employment_status || "Resigned",
      employee_other_status: "",
      employee_other_status_remarks: "",
    })
  }

  async function submitArchive(id: number) {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch("/api/hr/settlement/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...form }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error || "Failed to archive user")
      setOpenId(null)
      await load()
    } catch (e: any) {
      setError(e?.message || "Failed to archive user")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">HR · Employees · Settlement</h1>

      <Card className="p-4">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-sm mb-1">Search</label>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Full name, Name, Email, Emp Code"
            />
          </div>
          <Button variant="outline" onClick={() => { setPage(1); load() }}>Search</Button>
        </div>
      </Card>

      {error && <div className="text-sm text-red-600">{error}</div>}
      {loading && <div>Loading...</div>}

      <Card className="p-4">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left">
              <tr>
                <th className="py-2 pr-4">ID</th>
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Emp Code</th>
                <th className="py-2 pr-4">Department</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {data.map((u) => (
                <tr key={u.id} className="border-t align-top">
                  <td className="py-2 pr-4">{u.id}</td>
                  <td className="py-2 pr-4">{u.Full_name || u.name}</td>
                  <td className="py-2 pr-4">{u.email}</td>
                  <td className="py-2 pr-4">{u.emp_code}</td>
                  <td className="py-2 pr-4">{u.department}</td>
                  <td className="py-2 pr-4">{u.employment_status}</td>
                  <td className="py-2 pr-4">
                    <Button variant="outline" size="sm" onClick={() => openArchive(u)}>Archive</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-4">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
          <div className="text-sm">Page {page} of {totalPages}</div>
          <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      </Card>

      <Dialog open={openId !== null} onOpenChange={(o) => { if (!o) setOpenId(null) }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Archive User {openId !== null ? `#${openId}` : ""}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Date of Resignation</label>
              <Input type="date" value={form.date_of_resignation} onChange={(e) => setForm({ ...form, date_of_resignation: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm mb-1">Expected Last Working Day</label>
              <Input type="date" value={form.expected_last_working_day} onChange={(e) => setForm({ ...form, expected_last_working_day: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm mb-1">Date of Relieving</label>
              <Input type="date" value={form.date_of_relieving} onChange={(e) => setForm({ ...form, date_of_relieving: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm mb-1">Employment Status</label>
              <Input value={form.employment_status} onChange={(e) => setForm({ ...form, employment_status: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm mb-1">Resignation Reason (Employee)</label>
              <Input value={form.resignation_reason_employee} onChange={(e) => setForm({ ...form, resignation_reason_employee: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm mb-1">Resignation Reason (Approver)</label>
              <Input value={form.resignation_reason_approver} onChange={(e) => setForm({ ...form, resignation_reason_approver: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm mb-1">Other Status</label>
              <Input value={form.employee_other_status} onChange={(e) => setForm({ ...form, employee_other_status: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm mb-1">Other Status Remarks</label>
              <Input value={form.employee_other_status_remarks} onChange={(e) => setForm({ ...form, employee_other_status_remarks: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setOpenId(null)}>Cancel</Button>
            <Button disabled={submitting} onClick={() => openId !== null && submitArchive(openId)}>{submitting ? "Archiving..." : "Confirm Archive"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}