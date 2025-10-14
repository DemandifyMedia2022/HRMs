"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"

type Leave = {
  l_id: number
  leave_type: string
  start_date: string
  end_date: string
  reason: string
  HRapproval: string
  HRrejectReason: string | null
  Managerapproval: string
  ManagerRejecjetReason: string | null
  leaveregdate: string
  added_by_user: string
}

type ApiResponse = {
  data: Leave[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export default function HRLeavesPage() {
  const [leaveType, setLeaveType] = useState("")
  const [month, setMonth] = useState("") // YYYY-MM
  const [userName, setUserName] = useState("")
  const [status, setStatus] = useState("") // HRapproval

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<Leave[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const qs = useMemo(() => {
    const p = new URLSearchParams()
    if (leaveType) p.set("leave_type", leaveType)
    if (month) p.set("month", month)
    if (userName) p.set("user_name", userName)
    if (status) p.set("Leaves_Status", status)
    p.set("page", String(page))
    p.set("pageSize", String(pageSize))
    return p.toString()
  }, [leaveType, month, userName, status, page, pageSize])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/leaves?${qs}`, { cache: "no-store" })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || "Failed to load leaves")
      }
      const data: ApiResponse = await res.json()
      setRows(data.data)
      setTotalPages(data.pagination.totalPages)
      setTotal(data.pagination.total)
    } catch (e: any) {
      setError(e?.message || "Failed to load leaves")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qs])

  async function updateStatus(id: number, approve: boolean) {
    const payload: any = approve
      ? { id, HRapproval: "approved", HRrejectReason: "" }
      : { id, HRapproval: "rejected", HRrejectReason: "Rejected by HR" }
    try {
      const res = await fetch(`/api/leaves`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || "Failed to update status")
      }
      await load()
    } catch (e) {
      alert((e as any)?.message || "Failed to update status")
    }
  }

  function resetFilters() {
    setLeaveType("")
    setMonth("")
    setUserName("")
    setStatus("")
    setPage(1)
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">All Employees Leaves</h1>
        <Link href="/pages/hr/leave/new" className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          New Leave
        </Link>
      </div>

      <div className="border rounded p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-sm mb-1">Leave Type</label>
            <input className="w-full border rounded px-3 py-2" value={leaveType} onChange={(e) => setLeaveType(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1">Month</label>
            <input type="month" className="w-full border rounded px-3 py-2" value={month} onChange={(e) => setMonth(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1">User Name</label>
            <input className="w-full border rounded px-3 py-2" value={userName} onChange={(e) => setUserName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1">HR Status</label>
            <select className="w-full border rounded px-3 py-2" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button onClick={() => { setPage(1); load() }} className="rounded border px-4 py-2">Apply</button>
            <button onClick={resetFilters} className="rounded border px-4 py-2">Reset</button>
          </div>
        </div>
      </div>

      <div className="border rounded p-4">
        <div className="text-sm text-muted-foreground mb-2">Total: {total}</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left">
              <tr>
                <th className="py-2 pr-4">ID</th>
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4">Start</th>
                <th className="py-2 pr-4">End</th>
                <th className="py-2 pr-4">User</th>
                <th className="py-2 pr-4">HR Status</th>
                <th className="py-2 pr-4">Reason</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="py-4" colSpan={8}>Loading...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td className="py-4" colSpan={8}>No records found</td></tr>
              ) : (
                rows.map((l) => (
                  <tr key={l.l_id} className="border-t">
                    <td className="py-2 pr-4">{l.l_id}</td>
                    <td className="py-2 pr-4">{l.leave_type}</td>
                    <td className="py-2 pr-4">{new Date(l.start_date).toLocaleDateString()}</td>
                    <td className="py-2 pr-4">{new Date(l.end_date).toLocaleDateString()}</td>
                    <td className="py-2 pr-4">{l.added_by_user}</td>
                    <td className="py-2 pr-4">{l.HRapproval}</td>
                    <td className="py-2 pr-4">{l.HRrejectReason || "-"}</td>
                    <td className="py-2 pr-4 space-x-2">
                      <button onClick={() => updateStatus(l.l_id, true)} className="rounded bg-green-600 px-3 py-1 text-white hover:bg-green-700">Approve</button>
                      <button onClick={() => updateStatus(l.l_id, false)} className="rounded bg-red-600 px-3 py-1 text-white hover:bg-red-700">Reject</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="text-sm">Page {page} of {totalPages}</div>
          <div className="space-x-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded border px-3 py-1 disabled:opacity-50">Prev</button>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded border px-3 py-1 disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  )
}