"use client"

import React, { useEffect, useMemo, useState } from "react"

export default function TeamPage() {
  const [me, setMe] = useState<{ name?: string; role?: string; job_role?: string } | null>(null)
  const [loadingMe, setLoadingMe] = useState(true)
  const [users, setUsers] = useState<Array<{ id: number; name: string; email: string; extension: string }>>([])
  const [extensions, setExtensions] = useState<Array<{ id: number; extension: string; username?: string }>>([])
  const [saving, setSaving] = useState<number | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [newExt, setNewExt] = useState({ username: "", password: "" })
  const [creating, setCreating] = useState(false)
  const [createMsg, setCreateMsg] = useState<string | null>(null)

  const canAssign = useMemo(() => {
    const raw = String(me?.job_role || me?.role || '')
    const jr = raw.toLowerCase().replace(/[\W_]+/g, ' ').replace(/\s+/g, ' ').trim()
    const isATL = jr.includes('assistant') && jr.includes('team') && jr.includes('lead')
    const isHOO = (jr.includes('head') && jr.includes('operation')) || jr === 'head of operations'
    return isATL || isHOO
  }, [me])

  useEffect(() => {
    setLoadingMe(true)
    fetch('/api/auth/me', { credentials: 'include' })
      .then(async r => {
        const j = await r.json().catch(() => ({}))
        if (r.ok) setMe(j)
      })
      .catch(() => {})
      .finally(() => setLoadingMe(false))
  }, [])

  useEffect(() => {
    // Always show users list as per requirement, but API requires privileged role, so fall back to minimal public view if 403
    fetch('/api/team/users', { credentials: 'include' })
      .then(async r => {
        const j = await r.json().catch(() => ([]))
        if (r.ok) setUsers(j)
        else setUsers([])
      })
      .catch(() => setUsers([]))
    fetch('/api/extensions', { credentials: 'include' })
      .then(async r => {
        const j = await r.json().catch(() => ([]))
        if (r.ok) setExtensions(j)
        else setExtensions([])
      })
      .catch(() => setExtensions([]))
  }, [])

  const onAssign = async (userId: number, extension: string) => {
    setSaving(userId)
    try {
      const res = await fetch(`/api/team/users/${userId}/extension`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extension }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.message || res.statusText)
      setUsers(prev => prev.map(u => (u.id === userId ? { ...u, extension } : u)))
    } catch (e) {
      // no-op
    } finally {
      setSaving(null)
    }
  }

  const refreshExtensions = async () => {
    try {
      const r = await fetch('/api/extensions', { credentials: 'include' })
      const j = await r.json().catch(() => ([]))
      if (r.ok) setExtensions(j)
    } catch {}
  }

  const onCreateExtension = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canAssign) return
    setCreating(true)
    setCreateMsg(null)
    try {
      const res = await fetch('/api/extensions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newExt.username, password: newExt.password }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j?.message || res.statusText)
      setCreateMsg(`Created extension ${j?.extension || ''}`)
      setNewExt({ username: '', password: '' })
      await refreshExtensions()
      setTimeout(() => setModalOpen(false), 500)
    } catch (err: any) {
      setCreateMsg('Error: ' + String(err?.message || err))
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Team</h1>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600">View team members and assign extensions.</p>
        {canAssign && (
          <button
            onClick={() => setModalOpen(true)}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Add Extension
          </button>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Add New Extension</h2>
              <button className="text-gray-500 hover:text-gray-700" onClick={() => setModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={onCreateExtension} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  className="w-full rounded-md border px-3 py-1.5 text-sm"
                  value={newExt.username}
                  onChange={(e) => setNewExt(s => ({ ...s, username: e.target.value }))}
                  placeholder="e.g., sip-user"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  className="w-full rounded-md border px-3 py-1.5 text-sm"
                  value={newExt.password}
                  onChange={(e) => setNewExt(s => ({ ...s, password: e.target.value }))}
                  placeholder="••••••••"
                />
              </div>
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {creating ? 'Creating…' : 'Create Extension'}
                </button>
                {createMsg && (
                  <span className={`text-sm ${createMsg.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>{createMsg}</span>
                )}
              </div>
              <p className="text-xs text-gray-500">The extension number will be auto-generated.</p>
            </form>
          </div>
        </div>
      )}

      {loadingMe && <div className="text-sm text-gray-600 mb-3">Loading your permissions...</div>}

      <div className="overflow-x-auto border rounded-md">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-2 font-medium text-gray-700">Name</th>
              <th className="text-left px-4 py-2 font-medium text-gray-700">Email</th>
              <th className="text-left px-4 py-2 font-medium text-gray-700">Extension</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-t">
                <td className="px-4 py-2">{u.name || '-'}</td>
                <td className="px-4 py-2">{u.email || '-'}</td>
                <td className="px-4 py-2">
                  {canAssign ? (
                    <div className="flex items-center gap-2">
                      <select
                        className="border rounded px-2 py-1"
                        value={u.extension || ''}
                        onChange={(e) => onAssign(u.id, e.target.value)}
                        disabled={saving === u.id}
                      >
                        <option value="">Unassigned</option>
                        {extensions.map(ex => (
                          <option key={ex.id} value={ex.extension}>{ex.extension}</option>
                        ))}
                      </select>
                      {saving === u.id && <span className="text-xs text-gray-500">Saving...</span>}
                    </div>
                  ) : (
                    <span>{u.extension || '-'}</span>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-gray-500" colSpan={3}>No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
