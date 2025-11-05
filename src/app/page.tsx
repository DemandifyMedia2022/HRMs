'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

function HomePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
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
      }
    };
    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // STEP 1: Login - Validate credentials and get token
      // "You say you're Sir Email-Password? Here's your entry token."
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
      
      if (!loginData.success || !loginData.token) {
        setError('Login failed. No token received.');
        setLoading(false);
        return;
      }

      if (CAN_LOG) {
        console.log(' Token generated');
        console.log('🔐 Encrypted Token:', loginData.token);
        console.log('👤 User ID:', loginData.userId);
      }

      // STEP 2: Validate token
      // "Show token. Let me verify it's authentic."
      if (CAN_LOG) console.log('\n Validating token...');
      const validateRes = await fetch('/api/auth/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: loginData.token })
      });

      if (!validateRes.ok) {
        const data = await validateRes.json().catch(() => ({}));
        setError(data?.message || 'Token validation failed');
        setLoading(false);
        return;
      }

      const validateData = await validateRes.json();
      
      if (!validateData.success) {
        setError('Token validation failed');
        setLoading(false);
        return;
      }

      if (CAN_LOG) {
        console.log(' Token is valid');
        console.log('📋 Validation Response:', validateData);
      }

      // STEP 3: Fetch user details with validated token
      // "Let me check your official scrolls... oh you're a Knight (role admin)."
      if (CAN_LOG) console.log('\nFetching user details from database...');
      const detailsRes = await fetch('/api/auth/user-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: loginData.token })
      });

      if (!detailsRes.ok) {
        const data = await detailsRes.json().catch(() => ({}));
        setError(data?.message || 'Failed to fetch user details');
        setLoading(false);
        return;
      }

      const detailsData = await detailsRes.json();
      
      if (!detailsData.success) {
        setError('Failed to fetch user details');
        setLoading(false);
        return;
      }
      
      if (CAN_LOG) {
        console.log('User details retrieved');
        console.log('Role:', detailsData?.user?.role ?? detailsData?.role);
      }

      const role = String((detailsData?.user?.role ?? detailsData?.role ?? 'user')).toLowerCase();

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Sign in</CardTitle>
            <CardDescription>Enter your email and password to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="flex justify-end">
                <Button asChild variant="link" className="px-0 text-sm">
                  <Link href="/forgot-password">Forgot password?</Link>
                </Button>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl">Loading...</CardTitle>
              <CardDescription>Please wait</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    }>
      <HomePageInner />
    </Suspense>
  );
}
