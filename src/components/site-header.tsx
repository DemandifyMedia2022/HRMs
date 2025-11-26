"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconBell, IconX } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';

interface Notification {
  id: number;
  employee_id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export function SiteHeader() {
  const router = useRouter();
  const [count, setCount] = useState<number | null>(null);
  const [role, setRole] = useState<'admin' | 'hr' | 'user'>('user');
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [employeeId, setEmployeeId] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    async function loadNotifications() {
      try {
        const meRes = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' });
        if (!meRes.ok) return;
        const meJson = await meRes.json().catch(() => null);
        if (!meJson) return;

        const roleStr = String(meJson.role || 'user').toLowerCase();
        const empId = String(meJson.emp_code || '');

        // Fetch attendance requests
        const [mineRes, pendingRes] = await Promise.all([
          fetch('/api/attendance/request-update?my=1', { cache: 'no-store' }),
          fetch('/api/attendance/request-update?status=pending', { cache: 'no-store' })
        ]);
        const [mine, pending] = await Promise.all([
          mineRes.ok ? mineRes.json() : { data: [] },
          pendingRes.ok ? pendingRes.json() : { data: [] }
        ]);

        // Fetch custom notifications
        let customNotifications: Notification[] = [];
        if (empId) {
          const notifRes = await fetch(`/api/notifications?employee_id=${empId}&unread_only=true`, { cache: 'no-store' });
          if (notifRes.ok) {
            const notifData = await notifRes.json();
            customNotifications = notifData.notifications || [];
          }
        }

        const myCount = Array.isArray(mine?.data) ? mine.data.length : 0;
        const pendingCount = Array.isArray(pending?.data) ? pending.data.length : 0;
        const normalizedRole: 'admin' | 'hr' | 'user' =
          roleStr === 'admin' || roleStr === 'hr' ? (roleStr as 'admin' | 'hr') : 'user';
        const attendanceCount = normalizedRole === 'hr' || normalizedRole === 'admin' ? pendingCount : myCount;
        const total = attendanceCount + customNotifications.length;

        if (!cancelled) {
          setRole(normalizedRole);
          setCount(total);
          setNotifications(customNotifications);
          setEmployeeId(empId);
        }
      } catch {
        if (!cancelled) {
          setCount(null);
        }
      }
    }
    void loadNotifications();

    // Refresh notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const hasNotifications = typeof count === 'number' && count > 0;
  const badgeText = hasNotifications ? (count! > 99 ? '99+' : String(count)) : '';

  const markAsRead = async (notificationId: number) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_ids: [notificationId] })
      });
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setCount(prev => (prev && prev > 0 ? prev - 1 : 0));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

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
              {hasNotifications && (
                <span className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 min-w-[0.9rem] rounded-full bg-red-500 px-1 text-center text-[8px] leading-tight text-white">
                  {badgeText}
                </span>
              )}
            </Button>
            {open && (
              <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-md border bg-background p-3 text-sm shadow-lg z-50">
                <div className="mb-2 flex items-center justify-between sticky top-0 bg-background pb-2">
                  <span className="font-medium">Notifications</span>
                  {hasNotifications && (
                    <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[8px] font-semibold text-white">
                      {badgeText}
                    </span>
                  )}
                </div>
                {!hasNotifications ? (
                  <p className="text-xs text-muted-foreground">No new notifications.</p>
                ) : (
                  <div className="space-y-2">
                    {/* Custom Notifications */}
                    {notifications.map(notif => (
                      <div key={notif.id} className="p-2 rounded-md border bg-card hover:bg-accent/50 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant={notif.type === 'break_alert' ? 'destructive' : 'default'} className="text-[10px] px-1.5 py-0">
                                {notif.type.replace('_', ' ')}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground">{formatTime(notif.created_at)}</span>
                            </div>
                            <p className="font-medium text-xs">{notif.title}</p>
                            <p className="text-xs text-muted-foreground">{notif.message}</p>
                            {notif.link && (
                              <Button
                                variant="link"
                                size="sm"
                                onClick={() => {
                                  router.push(notif.link!);
                                  markAsRead(notif.id);
                                  setOpen(false);
                                }}
                                className="h-auto p-0 text-xs text-primary"
                              >
                                View Details →
                              </Button>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={() => markAsRead(notif.id)}
                          >
                            <IconX className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    {/* Attendance Requests */}
                    {(role === 'hr' || role === 'admin') && count! > notifications.length && (
                      <div className="p-2 rounded-md border bg-card">
                        <p className="text-xs mb-1">You have pending attendance approvals.</p>
                        <Button
                          variant="link"
                          onClick={() => {
                            router.push('/pages/hr/attendance/status');
                            setOpen(false);
                          }}
                          className="h-auto p-0 text-xs text-primary"
                        >
                          Go to Attendance Approvals →
                        </Button>
                      </div>
                    )}

                    {role === 'user' && count! > notifications.length && (
                      <div className="p-2 rounded-md border bg-card">
                        <p className="text-xs mb-1">You have attendance requests.</p>
                        <Button
                          variant="link"
                          onClick={() => {
                            router.push('/pages/user/attendance/status');
                            setOpen(false);
                          }}
                          className="h-auto p-0 text-xs text-primary"
                        >
                          View My Requests →
                        </Button>
                      </div>
                    )}
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
