"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Issue = {
  id: number;
  name: string | null;
  department: string | null;
  issuse_type: string | null;
  reason: string | null;
  added_by_user: string | null;
  status: string | null;
  Date_Attendance_Update: string | null;
  Attendance_status: string | null;
  Attendance_Approval: string | null;
  Attendance_feedback: string | null;
  raisedate: string | null;
};

export default function Page() {
  const [date, setDate] = useState<string>("");
  const [desired, setDesired] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [myRequests, setMyRequests] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadMine() {
    setLoading(true);
    try {
      const res = await fetch("/api/attendance/request-update?my=1", { cache: "no-store" });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setMyRequests(json.data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMine();
  }, []);

  async function submit() {
    setMessage("");
    if (!date || !desired || !reason) {
      setMessage("Please fill all fields.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/attendance/request-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, desired_status: desired, reason }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed");
      setMessage("Request submitted.");
      setDate("");
      setDesired("");
      setReason("");
      await loadMine();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-semibold">User · Attendance · Request Update</h1>

      <Card>
        <CardHeader>
          <CardTitle>Submit Attendance Update Request</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <div className="text-sm">Date</div>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <div className="text-sm">Desired Status</div>
              <Select value={desired} onValueChange={setDesired}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Present">Present</SelectItem>
                  <SelectItem value="Half-day">Half-day</SelectItem>
                  <SelectItem value="Absent">Absent</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 md:col-span-1">
              <div className="text-sm">Reason</div>
              <Input placeholder="Short reason" value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={submit} disabled={submitting}>{submitting ? "Submitting..." : "Submit"}</Button>
            {message ? <div className="text-sm text-blue-700">{message}</div> : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm">Loading…</div>
          ) : myRequests.length === 0 ? (
            <div className="text-sm text-gray-600">No requests yet.</div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Approval</th>
                    <th className="py-2 pr-4">Reason</th>
                    <th className="py-2 pr-4">Feedback</th>
                    <th className="py-2 pr-4">Raised</th>
                  </tr>
                </thead>
                <tbody>
                  {myRequests.map((r) => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">{r.Date_Attendance_Update?.slice(0, 10) || ""}</td>
                      <td className="py-2 pr-4">{r.Attendance_status || ""}</td>
                      <td className="py-2 pr-4">{r.Attendance_Approval || r.status || "pending"}</td>
                      <td className="py-2 pr-4">{r.reason || ""}</td>
                      <td className="py-2 pr-4">{r.Attendance_feedback || ""}</td>
                      <td className="py-2 pr-4">{r.raisedate ? new Date(r.raisedate).toLocaleString() : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
