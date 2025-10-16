"use client"

import React, { useEffect, useMemo, useState } from "react"
import { SidebarConfig } from "@/components/sidebar-config"

export default function CampaignListPage() {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [authLoading, setAuthLoading] = useState<boolean>(true)
  const [authRole, setAuthRole] = useState<string>("")
  const [authDept, setAuthDept] = useState<string>("")
  const [authEmail, setAuthEmail] = useState<string>("")

  useEffect(() => {
    fetch('/api/campaigns', { credentials: 'include' })
      .then(r => r.json())
      .then(j => setRows(Array.isArray(j?.data) ? j.data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

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

  const canEdit = useMemo(() => {
    const norm = (v: string) => (v || '').toLowerCase().replace(/[\-_]/g, ' ').replace(/\s+/g, ' ').trim()
    const role = norm(authRole)
    const dept = (authDept || '').toLowerCase()
    const email = (authEmail || '').toLowerCase()
    return role.includes('assistant team lead') || role.includes('head of operation') || (dept === 'operation' && (role.includes('lead') || role.includes('head'))) || email === 'asfiya.pathan@demandifymedia.com'
  }, [authRole, authDept, authEmail])

  return (
    <>
      <SidebarConfig role="user" />
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Campaign List</h1>
        <p className="text-sm text-gray-600 mb-4">All users can view campaigns. Only specific roles can edit.</p>

        {(authLoading || loading) && (
          <div className="text-sm text-gray-600">Loading...</div>
        )}

        {!loading && (
          <div className="overflow-x-auto border rounded-md">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="text-left px-3 py-2">ID</th>
                  <th className="text-left px-3 py-2">Campaign</th>
                  <th className="text-left px-3 py-2">Start</th>
                  <th className="text-left px-3 py-2">End</th>
                  <th className="text-left px-3 py-2">Status</th>
                  <th className="text-left px-3 py-2">Script</th>
                  <th className="text-left px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-3 py-2">{r.id}</td>
                    <td className="px-3 py-2">{r.f_campaign_name}</td>
                    <td className="px-3 py-2">{r.f_start_date ? new Date(r.f_start_date).toLocaleDateString() : '-'}</td>
                    <td className="px-3 py-2">{r.f_end_date ? new Date(r.f_end_date).toLocaleDateString() : '-'}</td>
                    <td className="px-3 py-2">{Number(r.f_status) ? 'Active' : 'Inactive'}</td>
                    <td className="px-3 py-2">
                      {r.f_script_url ? (
                        <a className="text-blue-600 hover:underline" href={r.f_script_url} target="_blank">Open</a>
                      ) : r.f_script ? (
                        <button
                          className="text-blue-600 hover:underline"
                          onClick={() => {
                            const w = window.open('', '_blank')
                            if (w) {
                              const esc = String(r.f_script || '').replace(/[&<>]/g, (m)=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[m] as string))
                              w.document.write(`<pre style='white-space:pre-wrap;font-family:ui-monospace,monospace;padding:12px;'>${esc}</pre>`) 
                              w.document.close()
                            }
                          }}
                        >View</button>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {canEdit ? (
                        <a
                          href={`/pages/crms/campaigns/add?editId=${r.id}`}
                          className="px-2 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700"
                          title="Edit campaign"
                        >Edit</a>
                      ) : (
                        <span className="text-gray-400 text-xs">No access</span>
                      )}
                    </td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr>
                    <td className="px-3 py-6 text-center text-gray-500" colSpan={7}>No campaigns found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
