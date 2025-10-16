"use client"

import React, { useEffect, useState } from "react"
import { SidebarConfig } from "@/components/sidebar-config"

export default function AdminPage() {
  const [authLoading, setAuthLoading] = useState(true)
  const [allowed, setAllowed] = useState(false)
  const [who, setWho] = useState<{ name?: string; role?: string } | null>(null)

  const [form, setForm] = useState({
    c_id: "",
    f_campaign_name: "",
    f_start_date: "",
    f_end_date: "",
    f_assignto: "",
    f_allocation: "",
    f_method: "",
    f_script: "",
    f_status: true, // Active by default
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const onChange = (k: string, v: string | boolean) => setForm((s: any) => ({ ...s, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!allowed) return
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j?.error || res.statusText)
      setMessage('Campaign added successfully.')
      setForm({ c_id: '', f_campaign_name: '', f_start_date: '', f_end_date: '', f_assignto: '', f_allocation: '', f_method: '', f_script: '', f_status: true })
    } catch (err: any) {
      setMessage('Error: ' + String(err?.message || err))
    } finally {
      setLoading(false)
    }

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(async r => {
        if (!r.ok) return
        const me = await r.json()
        const role = String(me?.role || '').toLowerCase()
        setWho({ name: me?.name, role })
        const allow = role === 'head of operation' || role === 'assistant team lead'
        setAllowed(allow)
      })
      .catch(() => {})
      .finally(() => setAuthLoading(false))
  }, [])
  }

  return (
    <>
      <SidebarConfig role="admin" />
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
        <p className="text-muted-foreground mb-6">Welcome to the Admin portal.</p>

        <div className="bg-white border rounded-lg p-6 max-w-3xl">
          <h2 className="text-lg font-semibold mb-4">Add Campaign</h2>
          {authLoading && (
            <div className="text-sm text-gray-600 mb-4">Checking permissions...</div>
          )}
          {!authLoading && !allowed && (
            <div className="p-3 mb-4 rounded-md bg-yellow-50 text-yellow-800 text-sm">
              Forbidden: This page is only visible to users with job role "Head Of Operation" or "Assistant Team Lead".
            </div>
          )}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Campaign ID</label>
              <input className="w-full rounded-md border px-3 py-1.5 text-sm" value={form.c_id} onChange={(e) => onChange('c_id', e.target.value)} />
            </div>
            <div className="md:col-span-1">
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
  )
}
