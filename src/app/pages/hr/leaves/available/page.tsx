"use client"

import { useEffect, useState } from "react"

type Leave = {
  l_id: number
  leave_type: string
  start_date: string
  end_date: string
  reason: string
  HRapproval: string
  Managerapproval: string
}

type AvailableResponse = {
  approvedLeaves: Leave[]
  LeaveApprovalData: Leave[]
  usedPaidLeave: number
  usedSickLeave: number
  remainingPaidLeave: number
  remainingSickLeave: number
  totals: { totalPaidLeave: number; totalSickLeave: number }
  user: string
}

export default function HRAvailableLeavePage() {
  const [userName, setUserName] = useState("")
  const [data, setData] = useState<AvailableResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    if (!userName) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/leaves/available?user_name=${encodeURIComponent(userName)}`, { cache: "no-store" })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || "Failed to load available leaves")
      }
      const json = await res.json()
      setData(json)
    } catch (e: any) {
      setError(e?.message || "Failed to load available leaves")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // noop: wait for user input
  }, [])

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Available Leave Details</h1>

      <div className="border rounded p-4">
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-sm mb-1">User Name</label>
            <input className="w-full border rounded px-3 py-2" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Enter user (added_by_user)" />
          </div>
          <button onClick={load} className="rounded border px-4 py-2">Load</button>
        </div>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      {loading && <div>Loading...</div>}

      {data && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded p-4">
              <h2 className="font-semibold mb-2">Summary</h2>
              <div className="text-sm space-y-1">
                <div>Total Paid Leave: {data.totals.totalPaidLeave}</div>
                <div>Used Paid Leave: {data.usedPaidLeave}</div>
                <div>Remaining Paid Leave: {data.remainingPaidLeave}</div>
              </div>
            </div>
            <div className="border rounded p-4">
              <h2 className="font-semibold mb-2">Sick Leave</h2>
              <div className="text-sm space-y-1">
                <div>Total Sick Leave: {data.totals.totalSickLeave}</div>
                <div>Used Sick Leave: {data.usedSickLeave}</div>
                <div>Remaining Sick Leave: {data.remainingSickLeave}</div>
              </div>
            </div>
          </div>

          <div className="border rounded p-4">
            <h2 className="font-semibold mb-2">Approved Leaves</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left">
                  <tr>
                    <th className="py-2 pr-4">Type</th>
                    <th className="py-2 pr-4">Start</th>
                    <th className="py-2 pr-4">End</th>
                  </tr>
                </thead>
                <tbody>
                  {data.approvedLeaves.map((l) => (
                    <tr key={l.l_id} className="border-t">
                      <td className="py-2 pr-4">{l.leave_type}</td>
                      <td className="py-2 pr-4">{new Date(l.start_date).toLocaleDateString()}</td>
                      <td className="py-2 pr-4">{new Date(l.end_date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="border rounded p-4">
            <h2 className="font-semibold mb-2">All Leaves (User)</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left">
                  <tr>
                    <th className="py-2 pr-4">Type</th>
                    <th className="py-2 pr-4">Start</th>
                    <th className="py-2 pr-4">End</th>
                    <th className="py-2 pr-4">HR</th>
                    <th className="py-2 pr-4">Mgr</th>
                  </tr>
                </thead>
                <tbody>
                  {data.LeaveApprovalData.map((l) => (
                    <tr key={l.l_id} className="border-t">
                      <td className="py-2 pr-4">{l.leave_type}</td>
                      <td className="py-2 pr-4">{new Date(l.start_date).toLocaleDateString()}</td>
                      <td className="py-2 pr-4">{new Date(l.end_date).toLocaleDateString()}</td>
                      <td className="py-2 pr-4">{l.HRapproval}</td>
                      <td className="py-2 pr-4">{l.Managerapproval}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}