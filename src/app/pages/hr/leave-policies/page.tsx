"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function PolicyStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md bg-slate-50/60 border border-slate-200 px-3 py-2">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="text-base font-semibold text-slate-900 mt-0.5">{value ?? '-'}</div>
    </div>
  );
}

export default function Page() {
  const [company, setCompany] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [firstTime, setFirstTime] = React.useState(false);

  const [form, setForm] = React.useState({
    total_paid_leave: "",
    total_sick_leave: "",
    accrual: "",
    carryover_paid: "",
    carryover_sick: ""
  });

  async function loadPolicy() {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/hr/leave-policies`, {
        credentials: "include"
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to load");
      const p = json.data;
      setCompany(json.company || "");
      if (p) {
        setFirstTime(false);
        setForm({
          total_paid_leave: p.total_paid_leave != null ? String(p.total_paid_leave) : "",
          total_sick_leave: p.total_sick_leave != null ? String(p.total_sick_leave) : "",
          accrual: p.accrual || "Annual",
          carryover_paid: p.carryover_paid != null ? String(p.carryover_paid) : "",
          carryover_sick: p.carryover_sick != null ? String(p.carryover_sick) : ""
        });
      } else {
        setFirstTime(true);
        setForm({ total_paid_leave: "", total_sick_leave: "", accrual: "", carryover_paid: "", carryover_sick: "" });
      }
    } catch (e: any) {
      setError(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    loadPolicy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function savePolicy(ev: React.FormEvent) {
    ev.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      const payload = {
        total_paid_leave: form.total_paid_leave !== "" ? Number(form.total_paid_leave) : null,
        total_sick_leave: form.total_sick_leave !== "" ? Number(form.total_sick_leave) : null,
        accrual: form.accrual,
        carryover_paid: form.carryover_paid !== "" ? Number(form.carryover_paid) : null,
        carryover_sick: form.carryover_sick !== "" ? Number(form.carryover_sick) : null
      };
      const res = await fetch("/api/hr/leave-policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to save");
      setSuccess("Leave policy saved successfully");
      setCompany(json.company || company);
    } catch (e: any) {
      setError(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 md:p-6 w-full mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Leave Policies</h1>
      </div>

      <Card className="shadow-sm border-0 bg-white gap-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-slate-900">Company</CardTitle>
         
        </CardHeader>
        <CardContent className="pt-0">
          <input
            type="text"
            className="w-full px-3 py-2 rounded-md border border-slate-200 bg-slate-50"
            value={company}
            readOnly
          />
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}
      {firstTime && !error && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          No leave policy found yet. Fill the form below and click Save Policy to create one.
        </div>
      )}
      {success && (
        <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{success}</div>
      )}

      {!firstTime && (
        <Card className="shadow-sm border-0 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-slate-900">Current Policy Summary</CardTitle>
            <CardDescription className="text-slate-600">
              These values are currently applied for employees of this company.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <PolicyStat label="Total Paid Leave" value={form.total_paid_leave || '-'} />
              <PolicyStat label="Total Sick Leave" value={form.total_sick_leave || '-'} />
              <PolicyStat label="Accrual" value={form.accrual || '-'} />
              <PolicyStat label="Carryover Paid" value={form.carryover_paid || 0} />
              <PolicyStat label="Carryover Sick" value={form.carryover_sick || 0} />
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-sm border-0 bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-slate-900">Edit Policy</CardTitle>
          <CardDescription className="text-slate-600">Update totals, accrual and carryover settings.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <form onSubmit={savePolicy} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Total Paid Leave (days/year)</label>
                <input
                  type="number"
                  min={0}
                  className="w-full px-3 py-2 rounded-md border border-slate-200 bg-white disabled:opacity-50"
                  value={form.total_paid_leave}
                  placeholder={firstTime ? "e.g., 12" : undefined}
                  onChange={(e) => setForm((f) => ({ ...f, total_paid_leave: e.target.value }))}
                  disabled={loading || saving}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Total Sick Leave (days/year)</label>
                <input
                  type="number"
                  min={0}
                  className="w-full px-3 py-2 rounded-md border border-slate-200 bg-white disabled:opacity-50"
                  value={form.total_sick_leave}
                  placeholder={firstTime ? "e.g., 6" : undefined}
                  onChange={(e) => setForm((f) => ({ ...f, total_sick_leave: e.target.value }))}
                  disabled={loading || saving}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Accrual</label>
                <select
                  className="w-full px-3 py-2 rounded-md border border-slate-200 bg-white disabled:opacity-50"
                  value={form.accrual}
                  onChange={(e) => setForm((f) => ({ ...f, accrual: e.target.value }))}
                  disabled={loading || saving}
                >
                  {firstTime && <option value="" disabled>Select accrual</option>}
                  <option value="Annual">Annual</option>
                  <option value="Monthly">Monthly</option>
                  <option value="None">None</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Carryover Paid (days)</label>
                <input
                  type="number"
                  min={0}
                  className="w-full px-3 py-2 rounded-md border border-slate-200 bg-white disabled:opacity-50"
                  value={form.carryover_paid}
                  placeholder={firstTime ? "e.g., 0" : undefined}
                  onChange={(e) => setForm((f) => ({ ...f, carryover_paid: e.target.value }))}
                  disabled={loading || saving}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Carryover Sick (days)</label>
                <input
                  type="number"
                  min={0}
                  className="w-full px-3 py-2 rounded-md border border-slate-200 bg-white disabled:opacity-50"
                  value={form.carryover_sick}
                  placeholder={firstTime ? "e.g., 0" : undefined}
                  onChange={(e) => setForm((f) => ({ ...f, carryover_sick: e.target.value }))}
                  disabled={loading || saving}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="px-4 py-2 rounded-md bg-[#125ca5] text-white hover:opacity-90 disabled:opacity-50"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Policy"}
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                onClick={loadPolicy}
                disabled={loading || saving}
              >
                {loading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
