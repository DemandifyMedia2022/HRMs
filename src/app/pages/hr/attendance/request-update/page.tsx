"use client";

import { useEffect, useState } from "react";
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
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const [status, setStatus] = useState<string>("pending");
  const [month, setMonth] = useState<string>(""); // YYYY-MM
  const [search, setSearch] = useState<string>(""); // search by user name
  const [requests, setRequests] = useState<Issue[]>([]);
  const [actionNote, setActionNote] = useState<string>("");

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (month) params.set("month", month);
      const res = await fetch(`/api/attendance/request-update?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      let data: Issue[] = json.data || [];
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        data = data.filter((r) => (r.added_by_user || r.name || "").toLowerCase().includes(q));
      }
      setRequests(data);
    } catch (e: any) {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, month]);

  async function act(id: number, approval: "approved" | "rejected") {
    setMessage("");
    try {
      const res = await fetch("/api/attendance/request-update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, approval, feedback: actionNote || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed");
      setMessage(approval === "approved" ? "Approved and synced to attendance." : "Rejected.");
      setActionNote("");
      await load();
    } catch (e: any) {
      setMessage(e?.message || "Failed");
    }
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-semibold">HR · Attendance · Request Update</h1>

      <Card>
        <CardHeader>
          <CardTitle>Filter</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <div className="text-sm">Status</div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <div className="text-sm">Month</div>
            <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          </div>
          <div className="space-y-1 md:col-span-2">
            <div className="text-sm">Search by user</div>
            <Input placeholder="Type user name" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} />
          </div>
          <div className="md:col-span-4 flex items-center gap-2">
            <Button variant="outline" onClick={() => { setStatus("pending"); setMonth(""); setSearch(""); }}>Reset</Button>
            <Button onClick={load}>Apply</Button>
            {message ? <div className="text-sm text-blue-700">{message}</div> : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm">Loading…</div>
          ) : requests.length === 0 ? (
            <div className="text-sm text-gray-600">No requests found.</div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 pr-4">User</th>
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Requested Status</th>
                    <th className="py-2 pr-4">Reason</th>
                    <th className="py-2 pr-4">Approval</th>
                    <th className="py-2 pr-4">Feedback</th>
                    <th className="py-2 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">{r.added_by_user || r.name || ""}</td>
                      <td className="py-2 pr-4">{r.Date_Attendance_Update?.slice(0, 10) || ""}</td>
                      <td className="py-2 pr-4">{r.Attendance_status || ""}</td>
                      <td className="py-2 pr-4 max-w-[280px] truncate" title={r.reason || undefined}>{r.reason || ""}</td>
                      <td className="py-2 pr-4">{r.Attendance_Approval || r.status || "pending"}</td>
                      <td className="py-2 pr-4 w-[220px]">
                        <Input placeholder="Feedback (optional)" value={actionNote} onChange={(e) => setActionNote(e.target.value)} />
                      </td>
                      <td className="py-2 pr-4 w-[240px]">
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => act(r.id, "approved")}>Approve</Button>
                          <Button size="sm" variant="outline" onClick={() => act(r.id, "rejected")}>Reject</Button>
                        </div>
                      </td>
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
