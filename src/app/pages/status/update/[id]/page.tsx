"use client"

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { SidebarConfig } from '@/components/sidebar-config'

function getCurrentUserName() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('userName') || 'Current User'
  }
  return 'Current User'
}

type Record = {
  f_id: number
  f_campaign_name: string
  f_lead: string
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

export default function UpdateRecordPage() {
  const params = useParams()
  const id = params?.id
  const [record, setRecord] = useState<Record | null>(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState<any>({})
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetch(`/api/status/${id}`)
      .then(r => r.json())
      .then(j => {
        if (j.error) throw new Error(j.error)
        setRecord(j.data)
        setFormData({
          f_email_status: j.data.f_email_status || '',
          f_qa_status: j.data.f_qa_status || '',
          f_delivary_status: j.data.f_delivary_status || '',
          form_status: j.data.form_status || '',
          f_qa_comments: j.data.f_qa_comments || '',
          f_call_rating: j.data.f_call_rating || '',
          f_call_notes: j.data.f_call_notes || '',
          feedback: j.data.feedback || '',
          f_call_links: j.data.f_call_links || '',
          f_qa_name: j.data.f_qa_name || '',
          f_audit_date: j.data.f_audit_date || '',
          f_delivary_date: j.data.f_delivary_date || '',
          f_delivary_by: j.data.f_delivary_by || '',
          f_reject_reason: j.data.f_reject_reason || '',
          qualifyleads_by: j.data.qualifyleads_by || getCurrentUserName(),
          added_by_user_id: j.data.added_by_user_id || getCurrentUserName(),
        })
      })
      .catch(err => setMessage({ text: String(err), type: 'error' }))
      .finally(() => setLoading(false))
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    setMessage(null)
    try {
      const res = await fetch(`/api/status/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Update failed')
      setMessage({ text: 'Updated', type: 'success' })
    } catch (err) {
      setMessage({ text: String(err), type: 'error' })
    }
  }

  if (!id) return <div className="p-6">Missing id</div>

  return (
    <div>
      <SidebarConfig role="user" />
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Update Record {id}</h1>
        {loading ? (
          <div>Loading...</div>
        ) : record ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">QA Status</label>
              <select value={formData.f_qa_status} onChange={(e) => setFormData((d:any)=>({...d, f_qa_status: e.target.value}))}>
                <option value="">Select</option>
                {STATUS_OPTIONS.qa.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">QA Comments</label>
              <textarea value={formData.f_qa_comments} onChange={(e) => setFormData((d:any)=>({...d, f_qa_comments: e.target.value}))} />
            </div>
            <div>
              <button type="submit" className="rounded bg-blue-600 text-white px-4 py-2">Save</button>
            </div>
            {message && <div className={message.type==='error'?'text-red-600':'text-green-600'}>{message.text}</div>}
          </form>
        ) : (
          <div>Record not found</div>
        )}
      </div>
    </div>
  )
}
