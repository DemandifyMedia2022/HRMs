"use client";

import React, { useEffect, useMemo, useState } from "react";
import { SidebarConfig } from "@/components/sidebar-config";

type CallRow = {
  id: number
  extension: string | null
  user_name: string | null
  destination: string | null
  direction: string | null
  status: string | null
  start_time: string | null
  answer_time: string | null
  end_time: string | null
  duration_seconds: number | null
  cause: string | null
  recording_url: string | null
}

export default function MyCallsPage() {
  const [authLoading, setAuthLoading] = useState(true)
  const [authDept, setAuthDept] = useState<string>("")
  const [authName, setAuthName] = useState<string>("")
  const [rows, setRows] = useState<CallRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(async r => {
        if (!r.ok) return
        const me = await r.json()
        setAuthDept(String(me?.department || ''))
        setAuthName(String(me?.name || ''))
      })
      .catch(() => {})
      .finally(() => setAuthLoading(false))
  }, [])

  useEffect(() => {
    if (!authName) return
    setLoading(true)
    fetch(`/api/call-data/list?user_name=${encodeURIComponent(authName)}`)
      .then(res => res.json())
      .then(j => {
        if (j.error) throw new Error(j.error)
        setRows(j.data || [])
      })
      .catch(err => setError(String(err)))
      .finally(() => setLoading(false))
  }, [authName])

  const isOperation = useMemo(() => authDept.toLowerCase() === 'operation', [authDept])

  return (
    <div>
      <SidebarConfig role="user" />
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="border-b pb-4">
            <h1 className="text-2xl font-semibold text-gray-900">My call data</h1>
            <p className="mt-2 text-sm text-gray-600">Your recent calls with recording downloads.</p>
          </div>

          {authLoading && <div className="text-sm text-gray-600">Checking permissions...</div>}
          {!authLoading && !isOperation && (
            <div className="p-4 rounded-md bg-yellow-50 text-yellow-800 text-sm">Forbidden: My call data is restricted to the Operation department.</div>
          )}

          {!authLoading && isOperation && (
            <div className="overflow-x-auto">
              {loading ? (
                <div className="text-sm text-gray-600">Loading calls...</div>
              ) : error ? (
                <div className="text-sm text-red-600">Error: {error}</div>
              ) : rows.length === 0 ? (
                <div className="text-sm text-gray-500">No calls found.</div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Start</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Destination</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Direction</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Recording</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {rows.map(r => (
                      <tr key={r.id}>
                        <td className="px-4 py-2 text-sm text-gray-700">{r.start_time ? new Date(r.start_time).toLocaleString() : '-'}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{r.destination || '-'}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{r.direction || '-'}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{r.status || '-'}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{typeof r.duration_seconds === 'number' ? `${r.duration_seconds}s` : '-'}</td>
                        <td className="px-4 py-2 text-sm">
                          {r.recording_url ? (
                            <a href={r.recording_url} download className="text-blue-600 hover:underline">Download</a>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}