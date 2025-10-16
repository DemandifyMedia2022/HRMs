"use client"

import React, { useState, useEffect } from 'react'
import { SidebarConfig } from '@/components/sidebar-config'
import DialerModal from '@/components/dialer/DialerModal'
import SipLoginModal from '@/components/dialer/SipLoginModal'

const FIELDS = [
  'f_campaign_name','f_lead','f_resource_name','f_data_source','f_salutation','f_first_name','f_last_name','f_job_title','f_department','f_job_level','f_email_add','Secondary_Email','f_conatct_no','f_company_name','f_website','f_address1','f_city','f_state','f_zip_code','f_country','f_emp_size','f_industry','f_sub_industry','f_revenue','f_revenue_link','f_profile_link','f_company_link','f_address_link','f_cq1','f_cq2','f_cq3','f_cq4','f_cq5','f_cq6','f_cq7','f_cq8','f_cq9','f_cq10','f_asset_name1','f_asset_name2','f_call_recording','f_dq_reason1','f_dq_reason2','f_dq_reason3','f_dq_reason4','f_call_links','f_date','added_by_user_id'
]

function getCurrentUserName() {
  // TODO: Replace with your real authentication/session logic
  if (typeof window !== 'undefined') {
    // Example: return window.session?.user?.name || 'Current User';
    return localStorage.getItem('userName') || 'Current User';
  }
  return 'Current User';
}

export default function UserPage() {
  const userName = getCurrentUserName();
  const [authUserName, setAuthUserName] = useState<string>("");
  const [authDept, setAuthDept] = useState<string>("");
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [formData, setFormData] = useState<Record<string, string | null>>({
    ...Object.fromEntries(FIELDS.map((f) => [f, ''])),
    added_by_user_id: userName
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [dialOpen, setDialOpen] = useState(false)
  const [dialNumber, setDialNumber] = useState<string>("")
  const [sipOpen, setSipOpen] = useState(false)
  const [sipStatus, setSipStatus] = useState<string>("")
  const [lastRecordingUrl, setLastRecordingUrl] = useState<string>("")
  const [campaigns, setCampaigns] = useState<Array<{ id: number; f_campaign_name: string; f_script?: string | null; f_script_url?: string | null }>>([])

  const onChange = (key: string, value: string) => {
    setFormData((s) => ({ ...s, [key]: value }))
  }

  // Ensure added_by_user_id is always set to userName
  useEffect(() => {
    setFormData((s) => ({ ...s, added_by_user_id: getCurrentUserName() }))
    const ext = typeof window !== 'undefined' ? localStorage.getItem('extension') : null
    setSipStatus(ext ? `Logged in as ${ext}` : 'Not logged in')
    // Try to fetch authenticated user
    fetch('/api/auth/me', { credentials: 'include' }).then(async (r) => {
      if (r.status === 401 || r.status === 403) {
        // Not authenticated, redirect to login/home
        if (typeof window !== 'undefined') window.location.href = '/';
        return;
      }
      if (!r.ok) return;
      const me = await r.json();
      const pretty = (me?.name || '').trim();
      setAuthDept(String(me?.department || ''))
      if (pretty) {
        setAuthUserName(pretty);
        setFormData((s) => ({ ...s, added_by_user_id: pretty }));
        try { localStorage.setItem('userName', pretty); } catch {}
        try { localStorage.setItem('authUser', JSON.stringify(me)); } catch {}
      }
    }).catch(() => {})
      .finally(() => setAuthLoading(false))
  }, [])

  // Read last call recording URL saved by Dialer after a call
  useEffect(() => {
    try {
      const u = typeof window !== 'undefined' ? localStorage.getItem('lastRecordingUrl') : ''
      if (u) setLastRecordingUrl(u)
    } catch {}
  }, [])

  // Load campaigns for dropdown
  useEffect(() => {
    fetch('/api/campaigns')
      .then(r => r.json())
      .then(j => {
        if (j?.data) setCampaigns(j.data)
      })
      .catch(() => {})
  }, [])

  const openSelectedCampaignScript = () => {
    const name = String(formData.f_campaign_name || '')
    if (!name) return
    const camp = campaigns.find(c => String(c.f_campaign_name) === name)
    if (!camp) return
    const url = camp.f_script_url
    if (url) {
      if (typeof window !== 'undefined') window.open(url, '_blank')
      return
    }
    const txt = (camp.f_script || '').trim()
    if (txt && typeof window !== 'undefined') {
      const w = window.open('', '_blank')
      if (w) {
        w.document.write(`<pre style="white-space:pre-wrap;font-family:ui-monospace,monospace;padding:12px;">${txt.replace(/[&<>]/g, (m)=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[m] as string))}</pre>`)
        w.document.close()
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const json = await res.json()
      if (!res.ok) {
        setMessage('Error: ' + (json?.error ?? res.statusText))
      } else {
        setMessage('Saved. InsertedId: ' + (json?.insertedId ?? 'unknown'))
      }
    } catch (err) {
      setMessage('Network error: ' + String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <SidebarConfig role="user" />
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">User Portal — DM Form</h1>
        <p className="text-muted-foreground mb-6">Fill fields and submit to store in <code>dm_form</code>.</p>

        {/* Auth gate */}
        {authLoading && (
          <div className="text-sm text-gray-600 mb-4">Checking permissions...</div>
        )}
        {!authLoading && authDept.toLowerCase() !== 'operation' && (
          <div className="p-4 mb-4 rounded-md bg-yellow-50 text-yellow-800 text-sm">
            Forbidden: Paste call data is restricted to the Operation department.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" aria-disabled={authDept.toLowerCase() !== 'operation'}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FIELDS.filter(f => f !== 'added_by_user_id').map((f) => (
              <div key={f} className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  {f.replace('f_', '').replace(/_/g, ' ')}
                </label>
                {f === 'f_conatct_no' ? (
                  <div className="flex items-center gap-2">
                    <input
                      className="w-full rounded-md border px-3 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      value={formData[f] ?? ''}
                      onChange={(e) => onChange(f, e.target.value)}
                      type="tel"
                    />
                    <button
                      type="button"
                      className="px-3 py-1.5 text-xs rounded bg-green-600 text-white disabled:opacity-50"
                      disabled={!formData[f]}
                      onClick={() => {
                        const ext = typeof window !== 'undefined' ? localStorage.getItem('extension') : null
                        if (!ext) {
                          setSipOpen(true)
                          return
                        }
                        setDialNumber(String(formData[f] || ''));
                        setDialOpen(true);
                      }}
                    >
                      Call
                    </button>
                  </div>
                ) : f === 'f_campaign_name' ? (
                  <div className="flex items-center gap-2">
                    <select
                      className="w-full rounded-md border px-3 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      value={formData[f] ?? ''}
                      onChange={(e) => onChange(f, e.target.value)}
                    >
                      <option value="">Select campaign...</option>
                      {campaigns.map(c => (
                        <option key={c.id} value={c.f_campaign_name}>{c.f_campaign_name}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="px-3 py-1.5 text-xs rounded bg-gray-100 text-gray-700 disabled:opacity-50"
                      disabled={!formData[f]}
                      onClick={openSelectedCampaignScript}
                    >
                      Open Script
                    </button>
                  </div>
                ) : (
                  <input
                    className="w-full rounded-md border px-3 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value={formData[f] ?? ''}
                    onChange={(e) => onChange(f, e.target.value)}
                    type={f.includes('date') ? 'datetime-local' : 
                          f.includes('email') ? 'email' :
                          'text'}
                  />
                )}
              </div>
            ))}
            {/* Hidden, auto-filled field for Added By (User ID) */}
            <input type="hidden" name="added_by_user_id" value={formData.added_by_user_id ?? ''} />
          </div>

          <div className="flex items-center gap-3 pt-4 border-t">
            <button 
              type="submit" 
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              disabled={loading || authDept.toLowerCase() !== 'operation'}
            >
              {loading ? 'Saving...' : 'Save to DB'}
            </button>
            <button
              type="button"
              className="rounded-md bg-gray-100 px-3 py-1.5 text-xs"
              onClick={() => setSipOpen(true)}
            >
              SIP Login
            </button>
            <div className="text-xs text-gray-600">{sipStatus}</div>
            {/* Download Recording link removed as requested */}
            {message && (
              <div className={`text-sm ${message.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
                {message}
              </div>
            )}
          </div>
        </form>
        <DialerModal open={dialOpen} onClose={() => setDialOpen(false)} number={dialNumber} userName={authUserName || getCurrentUserName()} />
        <SipLoginModal open={sipOpen} onClose={() => {
          setSipOpen(false);
          const ext = typeof window !== 'undefined' ? localStorage.getItem('extension') : null
          setSipStatus(ext ? `Logged in as ${ext}` : 'Not logged in')
        }} />
      </div>
    </>
  )
}
