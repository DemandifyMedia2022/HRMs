"use client"

import React, { useEffect, useState } from 'react'
import { SidebarConfig } from '@/components/sidebar-config'

export default function CrmsStatusPage() {
  const [campaigns, setCampaigns] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch('/api/status/campaigns')
      .then(r => r.json())
      .then(j => {
        if (j.error) throw new Error(j.error)
        // rows may be objects like { f_campaign_name: 'Foo' }
        const names = (j.data || []).map((row: any) => row.f_campaign_name)
        setCampaigns(names)
      })
      .catch(err => setError(String(err)))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <SidebarConfig role="user" />
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">CRMS — Campaigns</h1>
        <p className="text-muted-foreground mb-6">List of campaign names from dm_form table.</p>

        {loading ? (
          <div>Loading campaigns...</div>
        ) : error ? (
          <div className="text-red-600">Error: {error}</div>
        ) : campaigns.length === 0 ? (
          <div className="text-gray-500">No campaigns with pending QA found.</div>
        ) : (
          <div className="grid gap-2">
            {campaigns.map((c) => (
              <a key={c} href={`/pages/status/campaign/${encodeURIComponent(c)}`} className="p-3 border rounded-md hover:bg-gray-50 text-blue-600">
                {c}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
