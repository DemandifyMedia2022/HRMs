"use client"

import { useEffect, useState } from "react"
import { SidebarConfig } from "@/components/sidebar-config"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"

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
    <div className="p-6">
      <SidebarConfig role="hr" />
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Available Leave Details</h1>
          <p className="text-sm text-muted-foreground">Lookup an employee to review their leave utilisation and balance.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Search Employee</CardTitle>
            <CardDescription>Use the user name as recorded in leave requests (`added_by_user`).</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="flex flex-col gap-4 sm:flex-row sm:items-end"
              onSubmit={(e) => {
                e.preventDefault()
                load()
              }}
            >
              <div className="flex-1 space-y-2">
                <Label htmlFor="user_name">User Name</Label>
                <Input
                  id="user_name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                />
              </div>
              <Button type="submit" disabled={!userName || loading} className="sm:w-auto">
                {loading ? "Loading..." : "View"}
              </Button>
            </form>
            {error ? (
              <div className="mt-4 rounded border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            ) : null}
          </CardContent>
        </Card>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-md" />
            ))}
          </div>
        ) : null}

        {!loading && data ? (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Paid Leave Summary</CardTitle>
                  <CardDescription>{data.user}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Total</span>
                    <span className="font-semibold">{data.totals.totalPaidLeave}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Used</span>
                    <span className="font-semibold text-amber-600">{data.usedPaidLeave}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Remaining</span>
                    <span className="font-semibold text-emerald-600">{data.remainingPaidLeave}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Sick Leave Summary</CardTitle>
                  <CardDescription>{data.user}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Total</span>
                    <span className="font-semibold">{data.totals.totalSickLeave}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Used</span>
                    <span className="font-semibold text-amber-600">{data.usedSickLeave}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Remaining</span>
                    <span className="font-semibold text-emerald-600">{data.remainingSickLeave}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Approved Leaves</CardTitle>
                <CardDescription>Leaves that were granted for the employee.</CardDescription>
              </CardHeader>
              <CardContent>
                {data.approvedLeaves.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No approved leaves recorded.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Start</TableHead>
                        <TableHead>End</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.approvedLeaves.map((l) => (
                        <TableRow key={l.l_id}>
                          <TableCell>{l.leave_type}</TableCell>
                          <TableCell>{new Date(l.start_date).toLocaleDateString()}</TableCell>
                          <TableCell>{new Date(l.end_date).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">All Leave Requests</CardTitle>
                <CardDescription>Comprehensive history of leave requests and approvals.</CardDescription>
              </CardHeader>
              <CardContent>
                {data.LeaveApprovalData.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No leave requests found.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Start</TableHead>
                        <TableHead>End</TableHead>
                        <TableHead>HR</TableHead>
                        <TableHead>Manager</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.LeaveApprovalData.map((l) => (
                        <TableRow key={l.l_id}>
                          <TableCell>{l.leave_type}</TableCell>
                          <TableCell>{new Date(l.start_date).toLocaleDateString()}</TableCell>
                          <TableCell>{new Date(l.end_date).toLocaleDateString()}</TableCell>
                          <TableCell>{l.HRapproval}</TableCell>
                          <TableCell>{l.Managerapproval}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </div>
  )
}