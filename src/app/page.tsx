'use client';

import { useState, useEffect } from 'react';
import type React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Login07 from '@/components/login-07';

function HomePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  const CAN_LOG = process.env.NODE_ENV !== 'production';

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          const role = String(data?.role || 'user').toLowerCase();
          // User is already logged in, redirect to their dashboard
          if (role === 'admin') router.push('/pages/admin');
          else if (role === 'hr') router.push('/pages/hr');
          else router.push('/pages/user');
        }
      } catch {
        // Not logged in, stay on login page
      } finally {
        setInitialLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // STEP 1: Login - Validate credentials; server sets httpOnly cookies
      // "You say you're Sir Email-Password? Here's your entry token (cookie)."
      if (CAN_LOG) console.log(' Sending login request...');
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });

      if (!loginRes.ok) {
        const data = await loginRes.json().catch(() => ({}));
        setError(data?.message || 'Invalid credentials');
        setLoading(false);
        return;
      }

      const loginData = await loginRes.json();
      if (!loginData?.success) {
        setError('Login failed');
        setLoading(false);
        return;
      }

      // STEP 2: Read session via /api/auth/me (relies on httpOnly cookie)
      if (CAN_LOG) console.log(' Checking session via /api/auth/me ...');
      const meRes = await fetch('/api/auth/me', { credentials: 'include' });
      if (!meRes.ok) {
        setError('Session check failed');
        setLoading(false);
        return;
      }
      const meData = await meRes.json();
      const role = String(meData?.role || 'user').toLowerCase();

      // STEP 4: Redirect based on role
      // "Proceed to your designated area."
      if (CAN_LOG) console.log('\n Redirecting based on role...');
      const redirect = searchParams.get('redirect');
      if (redirect && redirect.startsWith('/pages/')) {
        if (CAN_LOG) console.log(' Redirecting to:', redirect);
        router.push(redirect);
      } else {
        // Redirect based on role
        if (role === 'admin') {
          if (CAN_LOG) console.log(' Redirecting to: /pages/admin');
          router.push('/pages/admin');
        } else if (role === 'hr') {
          if (CAN_LOG) console.log(' Redirecting to: /pages/hr');
          router.push('/pages/hr');
        } else {
          if (CAN_LOG) console.log('Redirecting to: /pages/user');
          router.push('/pages/user');
        }
      }

      if (CAN_LOG) console.log('\n Authentication flow completed successfully!');
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. Please check your credentials.');
      setLoading(false);
    }
  };

  // Show loading state during initial auth check
  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Login07
      email={email}
      password={password}
      loading={loading}
      error={error}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onSubmit={handleSubmit}
    />
  );
}

import { Suspense } from 'react';

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomePageInner />
    </Suspense>
  );
}
