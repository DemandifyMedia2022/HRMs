"use client";

import React, { useEffect, useMemo, useState } from "react";
import { SidebarConfig } from "@/components/sidebar-config";

export default function AddCampaignPage() {
  const [editId, setEditId] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [authRole, setAuthRole] = useState<string>("")
  const [authDept, setAuthDept] = useState<string>("")
  const [authEmail, setAuthEmail] = useState<string>("")

  const [form, setForm] = useState({
    c_id: "",
    f_campaign_name: "",
    f_start_date: "",
    f_end_date: "",
    f_assignto: "",
    f_allocation: "",
    f_method: "",
    f_script: "",
    f_status: true,
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const onChange = (k: string, v: string | boolean) => setForm((s: any) => ({ ...s, [k]: v }))

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(async r => {
        if (!r.ok) return
        const me = await r.json()
        setAuthEmail(String(me?.email ?? ''))
        setAuthDept(String(me?.department ?? ''))
        setAuthRole(String(me?.job_role ?? me?.role ?? me?.designation ?? me?.title ?? ''))
      })
      .catch(() => {})
      .finally(() => setAuthLoading(false))
  }, [])

  useEffect(() => {
    // Derive editId only on client to avoid SSR/client mismatch
    if (typeof window === 'undefined') return
    const sp = new URLSearchParams(window.location.search)
    const id = sp.get('editId') || null
    setEditId(id)
    if (!id) return
    ;(async () => {
      try {
        const r = await fetch(`/api/campaigns/${id}`, { credentials: 'include' })
        const j = await r.json()
        if (!r.ok) throw new Error(j?.error || r.statusText)
        const rec = j?.data || {}
        setForm((s) => ({
          ...s,
          c_id: String(rec.c_id ?? ''),
          f_campaign_name: String(rec.f_campaign_name ?? ''),
          f_start_date: rec.f_start_date ? String(rec.f_start_date).slice(0,10) : '',
          f_end_date: rec.f_end_date ? String(rec.f_end_date).slice(0,10) : '',
          f_assignto: String(rec.f_assignto ?? ''),
          f_allocation: String(rec.f_allocation ?? ''),
          f_method: String(rec.f_method ?? ''),
          f_script: String(rec.f_script ?? ''),
          f_status: !!Number(rec.f_status ?? 1),
          f_script_url: String(rec.f_script_url ?? ''),
        } as any))
      } catch {}
    })()
  }, [])

  const allowed = useMemo(() => {
    const norm = (v: string) => (v || '').toLowerCase().replace(/[\-_]/g, ' ').replace(/\s+/g, ' ').trim()
    const role = norm(authRole)
    const email = (authEmail || '').toLowerCase()
    return role.includes('assistant team lead') || role.includes('head of operation') || email === 'asfiya.pathan@demandifymedia.com'
  }, [authRole, authEmail])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!allowed) return
    setLoading(true)
    setMessage(null)
    try {
      const isEdit = !!editId
      const url = isEdit ? `/api/campaigns/${editId}` : '/api/campaigns'
      const method = isEdit ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j?.error || res.statusText)
      setMessage(isEdit ? 'Campaign updated successfully.' : 'Campaign added successfully.')
      setForm({ c_id: '', f_campaign_name: '', f_start_date: '', f_end_date: '', f_assignto: '', f_allocation: '', f_method: '', f_script: '', f_status: true, f_script_url: '' } as any)
    } catch (err: any) {
      setMessage('Error: ' + String(err?.message || err))
    } finally {
      setLoading(false)
    }
  }

  const onScriptFile = async (file?: File | null) => {
    if (!file) return
    setUploading(true)
    setMessage(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/campaigns/upload', { method: 'POST', body: fd })
      const j = await res.json()
      if (!res.ok || j.error) throw new Error(j.error || res.statusText)
      onChange('f_script_url', String(j.url || ''))
      setMessage('Script uploaded.')
    } catch (e: any) {
      setMessage('Error uploading script: ' + String(e?.message || e))
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <SidebarConfig role="user" />
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">{editId ? 'Edit Camagin' : 'Add Campaign'}</h1>
        <p className="text-muted-foreground mb-6">Only "Head Of Operation" and "Assistant Team Lead" can add campaigns.</p>

        {authLoading && (
          <div className="text-sm text-gray-600 mb-4">Checking permissions...</div>
        )}
        {!authLoading && !allowed && (
          <div className="p-3 mb-4 rounded-md bg-yellow-50 text-yellow-800 text-sm">Forbidden: You do not have permission to add campaigns.</div>
        )}

        <div className="bg-white border rounded-lg p-6 max-w-3xl">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Campaign ID</label>
              <input className="w-full rounded-md border px-3 py-1.5 text-sm" value={form.c_id} onChange={(e) => onChange('c_id', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
              <input className="w-full rounded-md border px-3 py-1.5 text-sm" value={form.f_campaign_name} onChange={(e) => onChange('f_campaign_name', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input type="date" className="w-full rounded-md border px-3 py-1.5 text-sm" value={form.f_start_date} onChange={(e) => onChange('f_start_date', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input type="date" className="w-full rounded-md border px-3 py-1.5 text-sm" value={form.f_end_date} onChange={(e) => onChange('f_end_date', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
              <input className="w-full rounded-md border px-3 py-1.5 text-sm" value={form.f_assignto} onChange={(e) => onChange('f_assignto', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Allocation</label>
              <input type="number" className="w-full rounded-md border px-3 py-1.5 text-sm" value={form.f_allocation} onChange={(e) => onChange('f_allocation', e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
              <input className="w-full rounded-md border px-3 py-1.5 text-sm" value={form.f_method} onChange={(e) => onChange('f_method', e.target.value)} placeholder="Email/Call/Mixed..." />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Script</label>
              <textarea className="w-full rounded-md border px-3 py-1.5 text-sm" rows={4} value={form.f_script} onChange={(e) => onChange('f_script', e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Script Document (upload)</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt,.rtf,.md,.html,.htm"
                onChange={(e) => onScriptFile(e.target.files?.[0])}
                className="block w-full text-sm"
              />
              {uploading && <div className="text-xs text-gray-500 mt-1">Uploading...</div>}
              {(form as any).f_script_url && (
                <div className="text-xs mt-1">Uploaded: <a className="text-blue-600 hover:underline" href={(form as any).f_script_url} target="_blank">Open</a></div>
              )}
            </div>
            <div className="md:col-span-2 flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Status</label>
              <button type="button" onClick={() => onChange('f_status', !form.f_status)} className={`px-3 py-1.5 rounded text-xs ${form.f_status ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
                {form.f_status ? 'Active' : 'Inactive'}
              </button>
            </div>

            <div className="md:col-span-2 pt-2 border-t flex items-center gap-3">
              <button type="submit" disabled={loading || !allowed} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">{loading ? 'Saving...' : 'Add Campaign'}</button>
              {message && <div className={`text-sm ${message.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>{message}</div>}
            </div>
          </form>
        </div>
      </div>
    </>
  );
}