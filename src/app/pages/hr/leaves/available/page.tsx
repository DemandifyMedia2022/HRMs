"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"

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

export default function UserAvailableLeavePage() {
  const searchParams = useSearchParams()
  const userFromQuery = useMemo(() => searchParams.get("user_name") || searchParams.get("added_by_user") || "", [searchParams])

  const [userName, setUserName] = useState<string>("")
  const [data, setData] = useState<AvailableResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load(targetUser?: string) {
    const u = (targetUser ?? userName).trim()
    if (!u) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/leaves/available?user_name=${encodeURIComponent(u)}`, { cache: "no-store" })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || "Failed to load available leaves")
      }
      const json = (await res.json()) as AvailableResponse
      setData(json)
    } catch (e: any) {
      setError(e?.message || "Failed to load available leaves")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userFromQuery) {
      setUserName(userFromQuery)
      // auto-load when query param is present
      load(userFromQuery)
    }
    else {
      ;(async () => {
        try {
          const meRes = await fetch("/api/auth/me", { cache: "no-store" })
          if (meRes.ok) {
            const me = await meRes.json()
            const candidate: string = me?.name || me?.email || ""
            if (candidate) {
              setUserName(candidate)
              load(candidate)
            }
          }
        } catch (e) {
        }
      })()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userFromQuery])

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">My Available Leave</h1>


      {error && <div className="text-sm text-red-600">{error}</div>}

      {loading && <div>Loading...</div>}

      {data && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4">
              <h2 className="font-semibold mb-2">Paid Leave</h2>
              <div className="text-sm space-y-1">
                <div>Total: {data.totals.totalPaidLeave}</div>
                <div>Used: {data.usedPaidLeave}</div>
                <div>Remaining: {data.remainingPaidLeave}</div>
              </div>
            </Card>
            <Card className="p-4">
              <h2 className="font-semibold mb-2">Sick Leave</h2>
              <div className="text-sm space-y-1">
                <div>Total: {data.totals.totalSickLeave}</div>
                <div>Used: {data.usedSickLeave}</div>
                <div>Remaining: {data.remainingSickLeave}</div>
              </div>
            </Card>
          </div>

          <Card className="p-4">
            <h2 className="font-semibold mb-2">All My Leaves</h2>
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
          </Card>
        </div>
      )}
    </div>
  )
}

