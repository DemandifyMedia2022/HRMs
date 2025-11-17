"use client";

import { useEffect, useState } from 'react';
import { IconBell } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';

export function SiteHeader() {
  const [count, setCount] = useState<number | null>(null);
  const [role, setRole] = useState<'admin' | 'hr' | 'user'>('user');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadCount() {
      try {
        const meRes = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' });
        if (!meRes.ok) return;
        const meJson = await meRes.json().catch(() => null);
        if (!meJson) return;

        const roleStr = String(meJson.role || 'user').toLowerCase();

        const [mineRes, pendingRes] = await Promise.all([
          fetch('/api/attendance/request-update?my=1', { cache: 'no-store' }),
          fetch('/api/attendance/request-update?status=pending', { cache: 'no-store' })
        ]);

        const [mine, pending] = await Promise.all([
          mineRes.ok ? mineRes.json() : { data: [] },
          pendingRes.ok ? pendingRes.json() : { data: [] }
        ]);

        const myCount = Array.isArray(mine?.data) ? mine.data.length : 0;
        const pendingCount = Array.isArray(pending?.data) ? pending.data.length : 0;

        const normalizedRole: 'admin' | 'hr' | 'user' =
          roleStr === 'admin' || roleStr === 'hr' ? (roleStr as 'admin' | 'hr') : 'user';

        const total = normalizedRole === 'hr' || normalizedRole === 'admin' ? pendingCount : myCount;

        if (!cancelled) {
          setRole(normalizedRole);
          setCount(total);
        }
      } catch {
        if (!cancelled) {
          setCount(null);
        }
      }
    }

    void loadCount();

    return () => {
      cancelled = true;
    };
  }, []);

  const hasNotifications = typeof count === 'number' && count > 0;
  const badgeText = hasNotifications ? (count! > 99 ? '99+' : String(count)) : '';

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />

        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 rounded-full border border-border"
              onClick={() => setOpen(prev => !prev)}
            >
              <IconBell className="h-4 w-4" />
              {hasNotifications ? (
                <span className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 min-w-[0.9rem] rounded-full bg-red-500 px-1 text-center text-[8px] leading-tight text-white">
                  {badgeText}
                </span>
              ) : null}
            </Button>

            {open && (
              <div className="absolute right-0 mt-2 w-72 rounded-md border bg-background p-3 text-sm shadow-lg z-50">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-medium">Notifications</span>
                  {hasNotifications ? (
                    <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[8px] font-semibold text-white">
                      {badgeText}
                    </span>
                  ) : null}
                </div>

                {!hasNotifications ? (
                  <p className="text-xs text-muted-foreground">No new notifications.</p>
                ) : role === 'hr' || role === 'admin' ? (
                  <div className="space-y-2">
                    <p>You have pending attendance approvals.</p>
                    <a
                      href="/pages/hr/attendance/status"
                      className="text-xs text-primary underline"
                    >
                      Go to Attendance Approvals
                    </a>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p>You have attendance requests.</p>
                    <a
                      href="/pages/user/attendance/status"
                      className="text-xs text-primary underline"
                    >
                      View My Requests
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
