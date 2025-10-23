"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CalendarDays, CalendarRange, NotebookPen, User, PlaneTakeoff, ArrowLeft } from "lucide-react"

export default function NewLeavePage() {
  const router = useRouter()
  const [leaveType, setLeaveType] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [reason, setReason] = useState("")
  const [addedByUser, setAddedByUser] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    if (!leaveType) {
      setError("Leave type is required")
      setSubmitting(false)
      return
    }
    try {
      const res = await fetch("/api/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Leave_Type: leaveType,
          Leave_Start_Date: startDate,
          Leave_End_Date: endDate,
          Reson: reason,
          added_by_user: addedByUser,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || "Failed to submit leave")
      }
      router.push("/pages/hr")
      router.refresh()
    } catch (err: any) {
      setError(err?.message || "Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50 to-indigo-50 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <PlaneTakeoff className="w-8 h-8 text-primary" />
              New Leave Request
            </h1>
            <p className="text-gray-600 mt-1">
              Submit a leave application with all the required details for quick approval.
            </p>
          </div>
          <Badge variant="secondary" className="text-sm px-4 py-2">HR Management</Badge>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex items-start gap-3 pt-4">
              <AlertCircle className="w-5 h-5 text-red-600 mt-1" />
              <div>
                <p className="text-sm font-medium text-red-800">{error}</p>
                <p className="text-xs text-red-600">Please review the information and try again.</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <NotebookPen className="w-5 h-5 text-primary" />
              Leave Details
            </CardTitle>
            <CardDescription>Provide accurate information to ensure smooth processing.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Leave Type</Label>
                <Select
                  value={leaveType}
                  onValueChange={(value) => setLeaveType(value)}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sick Leave(Full Day)">Sick Leave (Full Day)</SelectItem>
                    <SelectItem value="Unpaid Leave">Unpaid Leave</SelectItem>
                    <SelectItem value="Paid Leave">Paid Leave</SelectItem>
                    <SelectItem value="Work From Home">Work From Home</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-muted-foreground" />
                    Start Date
                  </Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <CalendarRange className="w-4 h-4 text-muted-foreground" />
                    End Date
                  </Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-muted-foreground" />
                  Reason
                </Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason for leave"
                  className="min-h-[140px]"
                  required
                />
              </div>


              <div className="flex flex-wrap items-center gap-3 pt-4">
                <Button type="submit" disabled={submitting} className="min-w-[160px]">
                  {submitting ? "Submitting..." : "Submit"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/pages/hr")}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-primary text-lg flex items-center gap-2">
              <PlaneTakeoff className="w-5 h-5" />
              Tips for Quick Approval
            </CardTitle>
            <CardDescription>Help approvers act on your request faster.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-primary/80 space-y-2 list-disc list-inside">
              <li>Ensure start and end dates are accurate and within your leave balance.</li>
              <li>Provide a concise yet clear reason for the leave.</li>
              <li>Submit requests at least one working day in advance when possible.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}