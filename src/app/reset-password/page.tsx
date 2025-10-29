'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

function ResetPasswordInner() {
  const sp = useSearchParams();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const e = sp.get('email') || '';
    if (e) setEmail(e);
  }, [sp]);

  const canSubmit = useMemo(
    () => email && otp && password && confirm && password === confirm,
    [email, otp, password, confirm]
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword: password })
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(j.message || 'Reset failed');
      } else {
        toast.success('Password updated');
        router.push('/');
      }
    } catch (e: any) {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-svh flex items-center justify-center p-6 bg-background">
      <Card className="w-full max-w-md shadow-sm">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl">Reset password</CardTitle>
          <CardDescription>Enter the OTP sent to your email and set a new password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="otp">OTP</Label>
              <Input id="otp" inputMode="numeric" value={otp} onChange={e => setOtp(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input id="confirm" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button type="submit" className="w-full" disabled={loading || !canSubmit}>
                {loading ? 'Saving…' : 'Reset password'}
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/forgot-password">Resend OTP</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordInner />
    </Suspense>
  );
}
