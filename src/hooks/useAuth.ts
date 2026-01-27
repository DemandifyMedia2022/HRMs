'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import type { UserRole } from '@/components/sidebar-config';

export type AuthUser = {
  name: string;
  email: string;
  role: UserRole;
  department: string | null;
  emp_code: string | null;
  profile_image: string | null;
};

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const validationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (!res.ok) {
        // If unauthorized, try to refresh token
        if (res.status === 401) {
          try {
            const refreshRes = await fetch('/api/auth/refresh', { 
              method: 'POST', 
              credentials: 'include' 
            });
            if (refreshRes.ok) {
              // Token refreshed successfully, retry fetching user
              const retryRes = await fetch('/api/auth/me', { credentials: 'include' });
              if (retryRes.ok) {
                const data = await retryRes.json().catch(() => null);
                if (data) {
                  const role = String(data.role || 'user').toLowerCase() as UserRole;
                  setUser({
                    name: data.name || 'User',
                    email: data.email || '',
                    role,
                    department: (data.department ?? null) as string | null,
                    emp_code: (data.emp_code ?? null) as string | null,
                    profile_image: (data.profile_image ?? null) as string | null
                  });
                  return;
                }
              }
            }
          } catch (refreshError) {
            console.warn('Token refresh failed:', refreshError);
          }
        }
        setUser(null);
      } else {
        const data = await res.json().catch(() => null);
        if (data) {
          const role = String(data.role || 'user').toLowerCase() as UserRole;
          setUser({
            name: data.name || 'User',
            email: data.email || '',
            role,
            department: (data.department ?? null) as string | null,
            emp_code: (data.emp_code ?? null) as string | null,
            profile_image: (data.profile_image ?? null) as string | null
          });
        } else {
          setUser(null);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Proactive token refresh - refresh token 5 minutes before expiration
  const scheduleTokenRefresh = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    
    // Schedule refresh for 55 minutes (5 minutes before 1-hour expiration)
    refreshTimeoutRef.current = setTimeout(async () => {
      try {
        await fetch('/api/auth/refresh', { 
          method: 'POST', 
          credentials: 'include' 
        });
        // Schedule next refresh
        scheduleTokenRefresh();
      } catch (error) {
        console.warn('Proactive token refresh failed:', error);
      }
    }, 55 * 60 * 1000); // 55 minutes
  }, []);

  // Session validation - check if session is still valid every 10 minutes
  const startSessionValidation = useCallback(() => {
    if (validationIntervalRef.current) {
      clearInterval(validationIntervalRef.current);
    }
    
    validationIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (!res.ok && res.status === 401) {
          // Session expired, try to refresh
          const refreshRes = await fetch('/api/auth/refresh', { 
            method: 'POST', 
            credentials: 'include' 
          });
          if (!refreshRes.ok) {
            // Refresh failed, user needs to login again
            setUser(null);
            setError('Session expired. Please login again.');
          }
        }
      } catch (error) {
        console.warn('Session validation failed:', error);
      }
    }, 10 * 60 * 1000); // 10 minutes
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (user) {
      // Start proactive token refresh and session validation when user is authenticated
      scheduleTokenRefresh();
      startSessionValidation();
    }

    return () => {
      // Cleanup timeouts and intervals
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      if (validationIntervalRef.current) {
        clearInterval(validationIntervalRef.current);
      }
    };
  }, [user, scheduleTokenRefresh, startSessionValidation]);

  return { user, loading, error, refresh: fetchUser };
}
