'use client';

import React from 'react';

export default function SipKeeper() {
  React.useEffect(() => {
    let mounted = true;
    let timer: any = null;
    let authTimer: any = null;
    async function initUA() {
      try {
        const username = typeof window !== 'undefined' ? localStorage.getItem('extension') || '' : '';
        const password = typeof window !== 'undefined' ? localStorage.getItem('sip_password') || '' : '';
        if (!username || !password) return;
        const JsSIP = (await import('jssip')).default;
        // @ts-ignore
        const existing = (window as any).__sipUA;
        if (existing) return;
        const socket = new JsSIP.WebSocketInterface('wss://pbx2.telxio.com.sg:8089/ws');
        const ua = new JsSIP.UA({
          uri: `sip:${username}@pbx2.telxio.com.sg`,
          password,
          sockets: [socket],
          register: true,
          session_timers: true,
          session_timers_refresh_method: 'UPDATE',
          connection_recovery_min_interval: 2,
          connection_recovery_max_interval: 30
        });
        ua.start();
        // @ts-ignore
        if (typeof window !== 'undefined') (window as any).__sipUA = ua;
      } catch {}
    }
    initUA();

    async function ensureCredsFromAuto() {
      try {
        const hasCreds = !!localStorage.getItem('extension') && !!localStorage.getItem('sip_password');
        if (hasCreds) return;
        const r = await fetch('/api/sip-auto', { credentials: 'include' });
        if (!r.ok) return;
        const j = await r.json();
        if (j?.extension && j?.password) {
          localStorage.setItem('extension', String(j.extension));
          localStorage.setItem('sip_password', String(j.password));
          window.dispatchEvent(new Event('sip-credentials-updated'));
        }
      } catch {}
    }
    void ensureCredsFromAuto();

    async function checkAuthAndSyncOwner() {
      try {
        const r = await fetch('/api/auth/me', { credentials: 'include' });
        if (!r.ok) return; // no auth or error => do NOT touch SIP; keep current
        const me = await r.json().catch(() => ({}) as any);
        const email = String(me?.email || '').toLowerCase();
        if (!email) return;
        const prev = (localStorage.getItem('sip_owner_email') || '').toLowerCase();
        if (prev && prev === email) return; // same owner; nothing to do
        // Auth switched to a different user => tear down current SIP and clear creds
        try {
          // @ts-ignore
          const ua = (window as any).__sipUA;
          ua?.stop?.();
        } catch {}
        // @ts-ignore
        (window as any).__sipUA = null;
        localStorage.removeItem('extension');
        localStorage.removeItem('sip_password');
        localStorage.setItem('sip_owner_email', email);
        // Auto assign from extensions table (includes password)
        try {
          const rr = await fetch('/api/sip-auto', { credentials: 'include' });
          if (rr.ok) {
            const j = await rr.json();
            if (j?.extension && j?.password) {
              localStorage.setItem('extension', String(j.extension));
              localStorage.setItem('sip_password', String(j.password));
            }
          }
        } catch {}
        // Notify dialer that credentials have changed
        window.dispatchEvent(new Event('sip-credentials-updated'));
      } catch {}
    }

    async function onCredsUpdated() {
      try {
        // @ts-ignore
        const ua = (window as any).__sipUA;
        try {
          ua?.stop?.();
        } catch {}
        // @ts-ignore
        (window as any).__sipUA = null;
      } catch {}
      await initUA();
    }
    function onLogout() {
      try {
        // @ts-ignore
        const ua = (window as any).__sipUA;
        try {
          ua?.stop?.();
        } catch {}
        // @ts-ignore
        (window as any).__sipUA = null;
      } catch {}
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('sip-credentials-updated', onCredsUpdated as any);
      window.addEventListener('sip-logout', onLogout as any);
      window.addEventListener('pageshow', initUA as any);
      // Periodically check auth user switch to enforce per-user SIP separation
      authTimer = window.setInterval(() => {
        void checkAuthAndSyncOwner();
      }, 8000);
      // Periodically ensure UA is alive when creds exist
      timer = window.setInterval(() => {
        try {
          // @ts-ignore
          const ua = (window as any).__sipUA;
          const hasCreds = !!localStorage.getItem('extension') && !!localStorage.getItem('sip_password');
          if (!ua && hasCreds) void initUA();
        } catch {}
      }, 5000);
      // React to cross-tab storage changes
      window.addEventListener('storage', (e: StorageEvent) => {
        if (!e.key) return;
        if (e.key === 'extension' || e.key === 'sip_password') {
          const hasCreds = !!localStorage.getItem('extension') && !!localStorage.getItem('sip_password');
          if (hasCreds) void onCredsUpdated();
          else onLogout();
        }
      });
    }
    return () => {
      mounted = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener('sip-credentials-updated', onCredsUpdated as any);
        window.removeEventListener('sip-logout', onLogout as any);
        window.removeEventListener('pageshow', initUA as any);
        if (timer) window.clearInterval(timer);
        if (authTimer) window.clearInterval(authTimer);
      }
    };
  }, []);
  return null;
}
