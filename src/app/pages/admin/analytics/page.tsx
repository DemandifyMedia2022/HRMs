"use client";

import React, { useEffect, useState } from "react";
import { SidebarConfig } from "@/components/sidebar-config";

export default function CrmsAnalyticsPage() {
  const [authLoading, setAuthLoading] = useState(true)
  const [role, setRole] = useState<string>("")
  // no inline Add Campaign card/modal on dashboard

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(async r => {
        if (!r.ok) return
        const me = await r.json()
        const rr = String(me?.role ?? me?.job_role ?? '').toLowerCase()
        setRole(rr.replace(/\s+/g,' ').trim())
      })
      .catch(() => {})
      .finally(() => setAuthLoading(false))
  }, [])

  // no inline Add Campaign form handlers
  return (
    <div>
      <SidebarConfig role="admin" />
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="border-b pb-4">
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard — User & Calls Analytics</h1>
            <p className="mt-2 text-sm text-gray-600">High-level overview for CRMS. This is your default landing dashboard after login.</p>
          </div>

          

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="text-sm text-gray-500">Total Calls (Today)</div>
              <div className="mt-2 text-3xl font-semibold">—</div>
            </div>
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="text-sm text-gray-500">Average Call Duration</div>
              <div className="mt-2 text-3xl font-semibold">—</div>
            </div>
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="text-sm text-gray-500">Unique Callers</div>
              <div className="mt-2 text-3xl font-semibold">—</div>
            </div>
            {/* Add Campaign card removed per request */}
          </div>

          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="text-sm text-gray-700 font-medium">Recent Activity</div>
            <div className="mt-2 text-sm text-gray-500">Analytics widgets coming soon.</div>
          </div>

          {/* Add Campaign modal removed per request */}
        </div>
      </div>
    </div>
  );
}