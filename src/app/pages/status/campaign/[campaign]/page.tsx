"use client"

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

type RecordItem = {
  f_id: number
  f_campaign_name: string
  f_lead: string
  f_email_status?: string
  f_qa_status?: string
  f_date?: string
}

export default function CampaignLeadsPage() {
  const params = useParams()
  const campaignParam = params?.campaign ?? ''
  const campaignName = decodeURIComponent(campaignParam as string)

  const [leads, setLeads] = useState<RecordItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/status/campaign/${encodeURIComponent(campaignName)}`)
      .then(r => r.json())
      .then(j => {
        if (j.error) throw new Error(j.error)
        setLeads(j.data || [])
      })
      .catch(err => setError(String(err)))
      .finally(() => setLoading(false))
  }, [campaignName])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Campaign: {campaignName}</h1>
      <p className="text-muted-foreground mb-6">Leads in this campaign. Click a lead to open the Quality Audit editor.</p>

      {/* Start Pending Queue */}
      <div className="mb-4">
        {(() => {
          const firstPending = leads.find(l => !l.f_qa_status || l.f_qa_status === 'pending')
          if (!firstPending) return (
            <div className="text-sm text-green-700 bg-green-50 rounded-md px-3 py-2 inline-block">No pending records in this campaign.</div>
          )
          return (
            <a
              href={`/pages/status/update?selectedId=${firstPending.f_id}&campaign=${encodeURIComponent(campaignName)}`}
              className="inline-flex items-center rounded bg-blue-600 text-white text-sm px-3 py-1.5 hover:bg-blue-500"
            >
              Start Pending Queue
            </a>
          )
        })()}
      </div>

      {loading ? (
        <div className="text-sm text-gray-600">Loading leads...</div>
      ) : error ? (
        <div className="text-sm text-red-600">Error: {error}</div>
      ) : leads.length === 0 ? (
        <div className="text-sm text-gray-500">No leads found for this campaign.</div>
      ) : (
        <div className="space-y-2">
          {leads.map(lead => (
            <div key={lead.f_id} className="flex items-center justify-between p-3 border rounded-md">
              <div>
                <div className="font-medium">{lead.f_lead}</div>
                <div className="text-sm text-gray-500">{lead.f_email_status || 'email: unknown'} • {lead.f_qa_status || 'qa: unknown'}</div>
              </div>
              <div>
                <a href={`/pages/status/update?selectedId=${lead.f_id}&campaign=${encodeURIComponent(campaignName)}`} className="text-sm text-blue-600 hover:underline">Open QA</a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
