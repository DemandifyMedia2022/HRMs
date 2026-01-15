"use client";
import { useEffect, useMemo, useState } from "react";

export default function PayrollFinalizePage() {
  const now = new Date();
  const [year, setYear] = useState<number>(now.getFullYear());
  const [month, setMonth] = useState<number>(now.getMonth() + 1);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    isFrozen: boolean;
    frozenAt: string | null;
    employeeCount: number;
    snapshotCount: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ymLabel = useMemo(() => `${year}-${String(month).padStart(2, "0")}`, [year, month]);
  const [backfillRunning, setBackfillRunning] = useState(false);
  const [backfillLog, setBackfillLog] = useState<string[]>([]);

  async function loadStatus(y = year, m = month) {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/payroll/status?year=${y}&month=${m}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed");
      setStatus(json.data);
    } catch (e: any) {
      setError(e?.message || "Failed to fetch status");
      setStatus(null);
    } finally {
      setLoading(false);
    }

  }

  function addLog(line: string) {
    setBackfillLog(prev => [line, ...prev].slice(0, 8));
  }

  async function callBackfillFromJan2025() {
    setError(null);
    setBackfillRunning(true);
    setBackfillLog([]);
    try {
      // From Jan 2025 to previous month
      const startY = 2025;
      const startM = 1;
      const today = new Date();
      const endDate = new Date(today.getFullYear(), today.getMonth(), 1); // current month start
      for (let y = startY; y <= endDate.getFullYear(); y++) {
        const mStart = y === startY ? startM : 1;
        const mEnd = y === endDate.getFullYear() ? endDate.getMonth() : 12; // up to previous month
        for (let m = mStart; m <= mEnd; m++) {
          addLog(`Finalizing ${y}-${String(m).padStart(2, '0')}...`);
          const res = await fetch(`/api/payroll/finalize`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ year: y, month: m }),
          });
          const json = await res.json();
          if (res.ok && json.success) {
            addLog(`✔ Finalized ${y}-${String(m).padStart(2, '0')}`);
          } else if (res.status === 409) {
            addLog(`• Already frozen ${y}-${String(m).padStart(2, '0')}`);
          } else if (res.status === 404) {
            addLog(`! No attendance for ${y}-${String(m).padStart(2, '0')}, skipped`);
          } else {
            addLog(`✖ Failed ${y}-${String(m).padStart(2, '0')}: ${json.error || json.message || 'Unknown error'}`);
          }
        }
      }
      await loadStatus();
    } catch (e: any) {
      setError(e?.message || "Backfill failed");
    } finally {
      setBackfillRunning(false);
    }
  }
  

  async function callFreeze() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/payroll/finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, month }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || json.message || "Freeze failed");
      await loadStatus();
    } catch (e: any) {
      setError(e?.message || "Freeze failed");
    } finally {
      setLoading(false);
    }
  }

  async function callUnfreeze() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/payroll/unfreeze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, month }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || json.message || "Unfreeze failed");
      await loadStatus();
    } catch (e: any) {
      setError(e?.message || "Unfreeze failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Payroll Finalize & Freeze</h1>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm">Month</label>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="border rounded px-2 py-1"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {String(m).padStart(2, "0")}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm">Year</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border rounded px-2 py-1 w-24"
          />
        </div>
        <div>
          <span className="text-sm text-gray-600">Period:</span>
          <span className="ml-2 font-medium">{ymLabel}</span>
        </div>
      </div>

      <div className="border rounded p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-sm text-gray-600">Status</div>
            <div className="text-lg font-medium">
              {status?.isFrozen ? (
                <span className="text-green-700">Frozen</span>
              ) : (
                <span className="text-yellow-700">Open</span>
              )}
            </div>
          </div>
          <div className="space-x-2">
            <button
              onClick={callFreeze}
              disabled={loading || !!status?.isFrozen}
              className="bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50"
            >
              Finalize & Freeze
            </button>
            <button
              onClick={callUnfreeze}
              disabled={loading || !status?.isFrozen}
              className="bg-red-600 text-white px-3 py-1 rounded disabled:opacity-50"
            >
              Unfreeze
            </button>
            <button
              onClick={callBackfillFromJan2025}
              disabled={loading || backfillRunning}
              className="bg-gray-700 text-white px-3 py-1 rounded disabled:opacity-50"
              title="Finalize all months from Jan 2025 up to the previous month"
            >
              Backfill from Jan 2025
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-600">Employees with attendance</div>
            <div className="font-medium">{status?.employeeCount ?? 0}</div>
          </div>
          <div>
            <div className="text-gray-600">Snapshots created</div>
            <div className="font-medium">{status?.snapshotCount ?? 0}</div>
          </div>
        </div>
        {backfillLog.length > 0 && (
          <div className="mt-2 text-xs text-gray-700 bg-gray-50 border rounded p-2 space-y-1 max-h-40 overflow-auto">
            {backfillLog.map((line, idx) => (
              <div key={idx}>{line}</div>
            ))}
          </div>
        )}
      </div>

      {error ? (
        <div className="text-red-600 text-sm">{error}</div>
      ) : null}
    </div>
  );
}
