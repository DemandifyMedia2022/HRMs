"use client"
 
import { useState } from "react"
import { useRouter } from "next/navigation"
 
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
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">New Leave Request</h1>
      {error && (
        <div className="mb-4 text-sm text-red-600">{error}</div>
      )}
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Leave Type</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value)}
            placeholder="Sick / Casual / Annual"
            required
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Start Date</label>
            <input
              type="date"
              className="w-full border rounded px-3 py-2"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1">End Date</label>
            <input
              type="date"
              className="w-full border rounded px-3 py-2"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm mb-1">Reason</label>
          <textarea
            className="w-full border rounded px-3 py-2"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for leave"
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Added By (Your Name)</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={addedByUser}
            onChange={(e) => setAddedByUser(e.target.value)}
            placeholder="Enter your name"
            required
          />
        </div>
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