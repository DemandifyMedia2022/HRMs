'use client';

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function SipLoginModal({ open, onClose }: Props) {
  const [extension, setExtension] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasSavedPassword, setHasSavedPassword] = useState(false);

  useEffect(() => {
    if (open) {
      const n = typeof window !== 'undefined' ? localStorage.getItem('userName') || '' : '';
      setDisplayName(n);
      // Load per-user SIP creds from backend
      setLoading(true);
      fetch('/api/sip-cred', { credentials: 'include' })
        .then(async r => {
          if (!r.ok) return;
          const j = await r.json();
          setExtension(j?.extension || '');
          setHasSavedPassword(Boolean(j?.hasPassword));
          // If backend has no creds for this user, clear any stale localStorage
          if ((!j?.extension || j.extension === '') && !j?.hasPassword && typeof window !== 'undefined') {
            try {
              localStorage.removeItem('extension');
              localStorage.removeItem('sip_password');
            } catch {}
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [open]);

  if (!open)
    return (
      <Dialog open={false}>
        <DialogContent className="hidden" />
      </Dialog>
    );

  const save = async () => {
    if (!extension || (!password && !hasSavedPassword)) return;
    try {
      setLoading(true);
      const res = await fetch('/api/sip-cred', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ extension, sip_password: password || undefined })
      });
      if (!res.ok) {
        // Fall back to localStorage only if backend fails
        if (typeof window !== 'undefined') {
          localStorage.setItem('extension', extension);
          if (password) localStorage.setItem('sip_password', password);
          if (displayName) localStorage.setItem('userName', displayName);
        }
      } else {
        // Keep localStorage in sync for Dialer
        if (typeof window !== 'undefined') {
          localStorage.setItem('extension', extension);
          if (password) localStorage.setItem('sip_password', password);
          if (displayName) localStorage.setItem('userName', displayName);
        }
        if (password) setHasSavedPassword(true);
      }
    } finally {
      setLoading(false);
      try {
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('sip-credentials-updated'));
      } catch {}
      onClose();
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      // Clear backend values
      await fetch('/api/sip-cred', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ extension: '', sip_password: '' })
      }).catch(() => {});
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('extension');
        localStorage.removeItem('sip_password');
      }
      setExtension('');
      setPassword('');
      setHasSavedPassword(false);
      try {
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('sip-logout'));
      } catch {}
      onClose();
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={o => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>SIP Extension Login</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="displayName">Display Name (for call logs)</Label>
            <Input
              id="displayName"
              placeholder="e.g. Rutuja Pawar rutuja.pawar@demandifymedia.com"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="extension">Username / Extension</Label>
            <Input
              id="extension"
              placeholder="e.g. 1033203"
              value={extension}
              onChange={e => setExtension(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              placeholder="••••••••"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            {hasSavedPassword && !password ? (
              <div className="text-[11px] text-muted-foreground">
                A password is already saved for your account. Leave blank to keep existing.
              </div>
            ) : null}
          </div>
          <div className="flex items-center justify-between pt-2">
            <Button onClick={save} disabled={!extension || (!!!password && !hasSavedPassword) || loading}>
              {loading ? 'Saving...' : 'Save & Login'}
            </Button>
            <Button variant="outline" onClick={logout}>
              Logout
            </Button>
          </div>
          <div className="text-xs text-muted-foreground">Server: pbx2.telxio.com.sg</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
