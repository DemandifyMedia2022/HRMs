"use client";

import React, { useEffect, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function SipLoginModal({ open, onClose }: Props) {
  const [extension, setExtension] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasSavedPassword, setHasSavedPassword] = useState(false);

  useEffect(() => {
    if (open) {
      const n = typeof window !== 'undefined' ? localStorage.getItem('userName') || '' : '';
      setDisplayName(n);
      // Load per-user SIP creds from backend
      setLoading(true)
      fetch('/api/sip-cred', { credentials: 'include' })
        .then(async r => {
          if (!r.ok) return
          const j = await r.json()
          setExtension(j?.extension || '')
          setHasSavedPassword(Boolean(j?.hasPassword))
          // If backend has no creds for this user, clear any stale localStorage
          if ((!j?.extension || j.extension === '') && !j?.hasPassword && typeof window !== 'undefined') {
            try {
              localStorage.removeItem('extension')
              localStorage.removeItem('sip_password')
            } catch {}
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [open]);

  if (!open) return null;

  const save = async () => {
    if (!extension || (!password && !hasSavedPassword)) return;
    try {
      setLoading(true)
      const res = await fetch('/api/sip-cred', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ extension, sip_password: password || undefined }),
      })
      if (!res.ok) {
        // Fall back to localStorage only if backend fails
        if (typeof window !== 'undefined') {
          localStorage.setItem('extension', extension)
          if (password) localStorage.setItem('sip_password', password)
          if (displayName) localStorage.setItem('userName', displayName)
        }
      } else {
        // Keep localStorage in sync for Dialer
        if (typeof window !== 'undefined') {
          localStorage.setItem('extension', extension)
          if (password) localStorage.setItem('sip_password', password)
          if (displayName) localStorage.setItem('userName', displayName)
        }
        if (password) setHasSavedPassword(true)
      }
    } finally {
      setLoading(false)
      try { if (typeof window !== 'undefined') window.dispatchEvent(new Event('sip-credentials-updated')) } catch {}
      onClose();
    }
  };

  const logout = async () => {
    try {
      setLoading(true)
      // Clear backend values
      await fetch('/api/sip-cred', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ extension: '', sip_password: '' }),
      }).catch(() => {})
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('extension');
        localStorage.removeItem('sip_password');
      }
      setExtension("");
      setPassword("");
      setHasSavedPassword(false)
      try { if (typeof window !== 'undefined') window.dispatchEvent(new Event('sip-logout')) } catch {}
      onClose();
      setLoading(false)
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-sm mx-4 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">SIP Extension Login</h2>
          <button onClick={onClose} className="text-sm px-2 py-1 rounded bg-gray-100 hover:bg-gray-200">Close</button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Display Name (for call logs)</label>
            <input
              className="w-full rounded border px-3 py-1.5 text-sm"
              placeholder="e.g. Rutuja Pawar rutuja.pawar@demandifymedia.com"
              value={displayName}
              onChange={(e)=>setDisplayName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Username / Extension</label>
            <input
              className="w-full rounded border px-3 py-1.5 text-sm"
              placeholder="e.g. 1033203"
              value={extension}
              onChange={(e)=>setExtension(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Password</label>
            <input
              className="w-full rounded border px-3 py-1.5 text-sm"
              placeholder="••••••••"
              type="password"
              value={password}
              onChange={(e)=>setPassword(e.target.value)}
            />
            {hasSavedPassword && !password && (
              <div className="text-[11px] text-gray-500 mt-1">A password is already saved for your account. Leave blank to keep existing.</div>
            )}
          </div>
          <div className="flex items-center justify-between pt-2">
            <button onClick={save} disabled={!extension || (!!!password && !hasSavedPassword) || loading} className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded disabled:opacity-50">{loading ? 'Saving...' : 'Save & Login'}</button>
            <button onClick={logout} className="text-sm px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200">Logout</button>
          </div>
          <div className="text-xs text-gray-500">Server: pbx2.telxio.com.sg</div>
        </div>
      </div>
    </div>
  );
}