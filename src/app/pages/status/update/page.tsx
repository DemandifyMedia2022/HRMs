"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SidebarConfig } from '@/components/sidebar-config';

function getCurrentUserName() {
  // TODO: Replace with your real authentication/session logic
  if (typeof window !== 'undefined') {
    // Example: return window.session?.user?.name || 'Current User';
    return localStorage.getItem('userName') || 'Current User';
  }
  return 'Current User';
}

type Record = {
  f_id: number
  f_campaign_name: string
  f_lead: string
  f_resource_name?: string
  f_email_status: string
  f_qa_status: string
  f_delivary_status: string
  form_status: string
  f_qa_comments: string
  f_call_rating: string
  f_call_notes: string
  feedback: string
  f_call_links?: string
  f_qa_name?: string
  f_audit_date?: string
  f_delivary_date?: string
  f_delivary_by?: string
  f_reject_reason?: string
  added_by_user_id?: string
  qualifyleads_by?: string
  f_date: string
}

const STATUS_OPTIONS = {
  email: ['pending', 'sent', 'failed', 'bounced'],
  qa: ['pending', 'approved', 'rejected', 'review'],
  delivery: ['pending', 'delivered', 'failed', 'in-progress'],
  form: ['draft', 'submitted', 'completed', 'rejected']
}

export default function UpdateStatusPage() {
  // For record selection
  const [records, setRecords] = useState<Record[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const search = useSearchParams()
  const router = useRouter()
  const [currentCampaign, setCurrentCampaign] = useState<string>('')
  const [resourceName, setResourceName] = useState<string>('')
  const [authLoading, setAuthLoading] = useState<boolean>(true)
  const [authAllowed, setAuthAllowed] = useState<boolean>(false)

  // For the form
  const [formData, setFormData] = useState({
    f_email_status: '',
    f_qa_status: '',
    f_delivary_status: '',
    form_status: '',
    f_qa_comments: '',
    f_call_rating: '',
    f_call_notes: '',
    feedback: '',
    f_call_links: '',
    f_dq_reason1: '',
    f_dq_reason2: '',
    f_dq_reason3: '',
    f_dq_reason4: '',
    f_qa_name: '',
    f_audit_date: '',
    f_delivary_date: '',
    f_delivary_by: '',
    f_reject_reason: '',
    qualifyleads_by: getCurrentUserName(),
    added_by_user_id: getCurrentUserName(),
  })

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [lastRecordingUrl, setLastRecordingUrl] = useState<string>("")
  
  // Auto-fill Qualify Leads By from authenticated user
  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(async (r) => {
        if (!r.ok) return;
        const me = await r.json();
        const pretty = (me?.name || '').trim();
        if (pretty) {
          setFormData(d => ({ ...d, qualifyleads_by: pretty }));
          try { localStorage.setItem('userName', pretty); } catch {}
        }
      })
      .catch(() => {});
  }, [])

  // Read last recording URL from localStorage (set by Dialer after a call)
  useEffect(() => {
    try {
      const u = typeof window !== 'undefined' ? localStorage.getItem('lastRecordingUrl') : ''
      if (u) setLastRecordingUrl(u)
    } catch {}
  }, [])

  // Auth gate for Quality department
  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(async r => {
        if (!r.ok) return
        const me = await r.json()
        const dept = String(me?.department || '').toLowerCase()
        const allowed = dept === 'quality'
        setAuthAllowed(allowed)
        if (!allowed) {
          // Optionally redirect or just block UI
          // router.push('/')
        }
      })
      .catch(() => {})
      .finally(() => setAuthLoading(false))
  }, [])

  // Load records for selection
  useEffect(() => {
    const qsSelected = search?.get?.('selectedId')
    const qsCampaign = search?.get?.('campaign')
    const fetchUrl = qsCampaign
      ? `/api/status/campaign/${encodeURIComponent(String(qsCampaign))}`
      : '/api/status'

    fetch(fetchUrl)
      .then(res => res.json())
      .then(async json => {
        if (json.error) throw new Error(json.error)
        const list = json.data || []
        setRecords(list)
        if (qsCampaign) setCurrentCampaign(String(qsCampaign))
        const nextId = qsSelected ?? (list[0] ? String(list[0].f_id) : '')
        if (nextId) {
          setSelectedId(nextId)
          await loadRecord(nextId)
        }
      })
      .catch(err => {
        setMessage({ text: String(err), type: 'error' })
      })
  }, [])

  // Load selected record
  const loadRecord = async (id: string) => {
    try {
      setLoading(true)
      const res = await fetch(`/api/status/${id}`)
      const json = await res.json()

      if (json.error) throw new Error(json.error)

      setFormData({
        f_email_status: json.data.f_email_status || '',
        f_qa_status: json.data.f_qa_status || '',
        f_delivary_status: json.data.f_delivary_status || '',
        form_status: json.data.form_status || '',
        f_qa_comments: json.data.f_qa_comments || '',
        f_call_rating: json.data.f_call_rating || '',
        f_call_notes: json.data.f_call_notes || '',
        feedback: json.data.feedback || '',
        f_call_links: json.data.f_call_links || '',
        f_dq_reason1: json.data.f_dq_reason1 || '',
        f_dq_reason2: json.data.f_dq_reason2 || '',
        f_dq_reason3: json.data.f_dq_reason3 || '',
        f_dq_reason4: json.data.f_dq_reason4 || '',
        f_qa_name: json.data.f_qa_name || '',
        f_audit_date: json.data.f_audit_date || '',
        f_delivary_date: json.data.f_delivary_date || '',
        f_delivary_by: json.data.f_delivary_by || '',
        f_reject_reason: json.data.f_reject_reason || '',
        // default to current user when DB value is empty
        qualifyleads_by: json.data.qualifyleads_by || getCurrentUserName(),
        added_by_user_id: json.data.added_by_user_id || getCurrentUserName(),
      })

      if (json?.data?.f_campaign_name && json.data.f_campaign_name !== currentCampaign) {
        setCurrentCampaign(json.data.f_campaign_name)
      }
      setResourceName(json.data.f_resource_name || '')

      setMessage(null)
    } catch (err) {
      setMessage({ text: String(err), type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // Handle record selection
  const handleSelectRecord = (id: string) => {
    setSelectedId(id)
    loadRecord(id)
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedId) return

    setLoading(true)
    setMessage(null)

    try {
      const res = await fetch(`/api/status/${selectedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const json = await res.json()

      if (!res.ok) throw new Error(json.error)

      setMessage({ text: 'Status updated successfully', type: 'success' })
      const refreshUrl = currentCampaign
        ? `/api/status/campaign/${encodeURIComponent(currentCampaign)}`
        : '/api/status'
      const refreshed = await fetch(refreshUrl).then(r => r.json())
      if (refreshed && !refreshed.error) {
        const list: any[] = refreshed.data || []
        setRecords(list)
        const nextId = list[0] ? String(list[0].f_id) : ''
        if (nextId) {
          setSelectedId(nextId)
          await loadRecord(nextId)
        } else {
          setSelectedId('')
          if (currentCampaign) {
            router.push(`/pages/status/campaign/${encodeURIComponent(currentCampaign)}`)
          }
        }
      }
    } catch (err) {
      setMessage({ text: String(err), type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <SidebarConfig role="user" />
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          <div className="border-b pb-4">
            <h1 className="text-2xl font-semibold text-gray-900">Update Form Status</h1>
            <p className="mt-2 text-sm text-gray-600">Select a record and update its status fields.</p>
          </div>

          {/* Auth gate */}
          {authLoading && (
            <div className="text-sm text-gray-600">Checking permissions...</div>
          )}
          {!authLoading && !authAllowed && (
            <div className="p-4 rounded-md bg-yellow-50 text-yellow-800 text-sm">
              Forbidden: Quality Audit form is restricted to the Quality department.
            </div>
          )}

          {/* Record Selection */}

          <div className="max-w-2xl">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Record to Update
            </label>
            <select
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={selectedId}
              onChange={(e) => handleSelectRecord(e.target.value)}
            >
              <option value="">Select a record...</option>
              {records.map((record) => (
                <option key={record.f_id} value={record.f_id}>
                  {record.f_campaign_name} - {record.f_lead} ({new Date(record.f_date).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>

        {/* Status Update Form */}
        <form onSubmit={handleSubmit} className="mt-8" aria-disabled={!authAllowed}>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 pb-2 border-b mb-4">Quality Audit</h3>
            <div className="mb-4 flex items-center gap-3 text-sm">
              <div className="font-medium text-gray-700">Resource Name:</div>
              <div className="px-2 py-1 rounded bg-gray-100 text-gray-700">{resourceName || 'N/A'}</div>
              {lastRecordingUrl && (
                <a
                  href={lastRecordingUrl}
                  download
                  className="ml-auto inline-flex items-center text-blue-600 hover:underline"
                  title="Download last call recording"
                >
                  Download Recording
                </a>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Status</label>
                <select
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={formData.f_email_status}
                  onChange={(e) => setFormData(d => ({ ...d, f_email_status: e.target.value }))}
                >
                  <option value="">Select status...</option>
                  {STATUS_OPTIONS.email.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">QA Status</label>
                <select
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={formData.f_qa_status}
                  onChange={(e) => setFormData(d => ({ ...d, f_qa_status: e.target.value }))}
                >
                  <option value="">Select status...</option>
                  {STATUS_OPTIONS.qa.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Status</label>
                <select
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={formData.f_delivary_status}
                  onChange={(e) => setFormData(d => ({ ...d, f_delivary_status: e.target.value }))}
                >
                  <option value="">Select status...</option>
                  {STATUS_OPTIONS.delivery.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Form Status</label>
                <select
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={formData.form_status}
                  onChange={(e) => setFormData(d => ({ ...d, form_status: e.target.value }))}
                >
                  <option value="">Select status...</option>
                  {STATUS_OPTIONS.form.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Call Rating</label>
                <input
                  type="text"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={formData.f_call_rating}
                  onChange={(e) => setFormData(d => ({ ...d, f_call_rating: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Call Links</label>
                <input
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={formData.f_call_links}
                  onChange={(e) => setFormData(d => ({ ...d, f_call_links: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">DQ Reason 1</label>
                <input
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={formData.f_dq_reason1}
                  onChange={(e) => setFormData(d => ({ ...d, f_dq_reason1: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">DQ Reason 2</label>
                <input
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={formData.f_dq_reason2}
                  onChange={(e) => setFormData(d => ({ ...d, f_dq_reason2: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">DQ Reason 3</label>
                <input
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={formData.f_dq_reason3}
                  onChange={(e) => setFormData(d => ({ ...d, f_dq_reason3: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">DQ Reason 4</label>
                <input
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={formData.f_dq_reason4}
                  onChange={(e) => setFormData(d => ({ ...d, f_dq_reason4: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">QA Name</label>
                <input
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={formData.f_qa_name}
                  onChange={(e) => setFormData(d => ({ ...d, f_qa_name: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Audit Date</label>
                <input
                  type="datetime-local"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={formData.f_audit_date}
                  onChange={(e) => setFormData(d => ({ ...d, f_audit_date: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Date</label>
                <input
                  type="datetime-local"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={formData.f_delivary_date}
                  onChange={(e) => setFormData(d => ({ ...d, f_delivary_date: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery By</label>
                <input
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={formData.f_delivary_by}
                  onChange={(e) => setFormData(d => ({ ...d, f_delivary_by: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reject Reason</label>
                <input
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={formData.f_reject_reason}
                  onChange={(e) => setFormData(d => ({ ...d, f_reject_reason: e.target.value }))}
                />
              </div>


              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">QA Comments</label>
                <textarea
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                  value={formData.f_qa_comments}
                  onChange={(e) => setFormData(d => ({ ...d, f_qa_comments: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Call Notes</label>
                <textarea
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                  value={formData.f_call_notes}
                  onChange={(e) => setFormData(d => ({ ...d, f_call_notes: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Feedback</label>
                <textarea
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                  value={formData.feedback}
                  onChange={(e) => setFormData(d => ({ ...d, feedback: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Qualify Leads By</label>
                <input
                  className="w-full rounded-md border-gray-300 shadow-sm bg-gray-100 cursor-not-allowed"
                  value={formData.qualifyleads_by}
                  readOnly
                  tabIndex={-1}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-8 pt-4 border-t flex items-center justify-between">
              <button
                type="submit"
                disabled={!selectedId || loading || !authAllowed}
                className="rounded-md bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Update Status'}
              </button>
              
              {message && (
                <div className={`px-4 py-2 rounded-md ${
                  message.type === 'error' 
                    ? 'bg-red-50 text-red-700' 
                    : 'bg-green-50 text-green-700'
                }`}>
                  {message.text}
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
      </div>
    </div>
  )
}