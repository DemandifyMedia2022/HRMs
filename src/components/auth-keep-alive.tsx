'use client';

import { useEffect, useRef } from 'react';
import { fetchWithAuth } from '@/lib/api';

/**
 * Keeps the session alive while the user is active by periodically
 * hitting /api/auth/me (which also refreshes the access cookie).
 *
 * Behavior:
 * - Pings every 5 minutes while the tab is visible
 * - Also pings on visibility change to visible and on route changes (via popstate)
 */
export function AuthKeepAlive() {
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const ping = async () => {
      try {
        await fetchWithAuth('/api/auth/me', { retryOn401: true });
      } catch {
        /* ignore */
      }
    };

    const start = () => {
      if (timerRef.current) return;
      // 5 minutes
      timerRef.current = window.setInterval(() => {
        if (document.visibilityState === 'visible') void ping();
      }, 5 * 60 * 1000);
    };

    const stop = () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') void ping();
    };

    const onPopState = () => {
      // route change via back/forward
      void ping();
    };

    start();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('popstate', onPopState);

    // initial ping once
    void ping();

    return () => {
      cancelled = true;
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('popstate', onPopState);
    };
  }, []);

  return null;
}
