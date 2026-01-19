
// Client-side authenticated fetch helper with CSRF and 401->refresh retry
// Usage: import { fetchWithAuth } from '@/lib/api'

export type FetchWithAuthOptions = RequestInit & {
  retryOn401?: boolean;
};

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find(c => c.startsWith(name + '='));
  return match ? decodeURIComponent(match.split('=')[1]) : null;
}

export async function fetchWithAuth(input: RequestInfo | URL, init: FetchWithAuthOptions = {}) {
  const { retryOn401 = true, headers, ...rest } = init;

  const method = (rest.method || 'GET').toUpperCase();
  const isMutating = method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE';

  const csrf = getCookie('csrf_token');
  const mergedHeaders: HeadersInit = {
    ...(headers || {}),
  };

  if (isMutating) {
    if (csrf) {
      (mergedHeaders as any)['x-csrf-token'] = csrf;
    }
    if (!(mergedHeaders as any)['Content-Type'] && rest.body && typeof rest.body === 'string') {
      (mergedHeaders as any)['Content-Type'] = 'application/json';
    }
  }

  const doFetch = async () =>
    fetch(input, {
      credentials: 'include',
      ...rest,
      headers: mergedHeaders,
    });

  let res = await doFetch();

  if (res.status === 401 && retryOn401) {
    try {
      const refreshRes = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });
      if (refreshRes.ok) {
        res = await doFetch();
      }
    } catch {
      // ignore and return original 401
    }
  }

  return res;
}
