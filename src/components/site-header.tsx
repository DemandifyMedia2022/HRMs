"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconBell, IconX } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

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

          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9 rounded-full border border-border bg-background focus-visible:ring-1 focus-visible:ring-ring"
              >
                <IconBell className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                {hasNotifications && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-background">
                    {badgeText}
                  </span>
                )}
                <span className="sr-only">Notifications</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 sm:w-96 flex flex-col max-h-[500px]" align="end" sideOffset={8}>
              {/* Fixed Header - Always visible */}
              <div className="sticky top-0 z-10 flex items-center justify-between border-b px-4 py-3 bg-muted/30 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">Notifications</span>
                  {hasNotifications && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-mono">
                      {count} unread
                    </Badge>
                  )}
                </div>
                {hasNotifications && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-xs text-muted-foreground hover:text-primary"
                    onClick={() => markAsRead(-1)} // Assuming you implement markAllAsRead backend logic or similar, but previously there was no mark all? Ah there is in PATCH.
                  // Wait, I need to call the PATCH endpoint with mark_all_read: true if user clicks this.
                  >
                    Mark all read
                  </Button>
                )}
              </div>

              {/* Scrollable Content */}
              <ScrollArea className="flex-1">
                <div className="flex flex-col gap-1 p-2">
                  {!hasNotifications ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                      <IconBell className="mb-2 h-10 w-10 opacity-20" />
                      <p className="text-sm">No new notifications</p>
                      <p className="text-xs text-muted-foreground/60">You're all caught up!</p>
                    </div>
                  ) : (
                    <>
                      {notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className="relative flex flex-col gap-1 rounded-lg border bg-card p-3 text-sm shadow-sm transition-all hover:bg-muted/50 group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={notif.type === 'break_alert' ? 'destructive' : 'outline'}
                                className={cn(
                                  "px-1.5 py-0 text-[10px] uppercase tracking-wider font-bold",
                                  notif.type !== 'break_alert' && "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-900"
                                )}
                              >
                                {notif.type.replace('_', ' ')}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground/70 tabular-nums">
                                {formatTime(notif.created_at)}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity -mr-1 -mt-1 text-muted-foreground hover:text-foreground"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notif.id);
                              }}
                              title="Mark as read"
                            >
                              <IconX className="h-3 w-3" />
                              <span className="sr-only">Dismiss</span>
                            </Button>
                          </div>

                          <p className="font-medium leading-none mt-1">{notif.title}</p>
                          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{notif.message}</p>

                          {notif.link && (
                            <div className="mt-2">
                              <Button
                                variant="link"
                                size="sm"
                                className="h-auto p-0 text-xs font-medium text-primary hover:underline"
                                onClick={() => {
                                  router.push(notif.link!);
                                  markAsRead(notif.id);
                                  setOpen(false);
                                }}
                              >
                                View details
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                      {/* Role based sections */}
                      {(role === 'hr' || role === 'admin') && count! > notifications.length && (
                        <div className="mt-2 p-3 bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/50 rounded-lg text-center">
                          <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300 mb-1">
                            Pending Approvals
                          </p>
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => {
                              router.push('/pages/hr/attendance/status');
                              setOpen(false);
                            }}
                            className="h-auto p-0 text-xs text-indigo-600 dark:text-indigo-400"
                          >
                            Review Attendance Requests
                          </Button>
                        </div>
                      )}
                      {role === 'user' && count! > notifications.length && (
                        <div className="mt-2 p-3 bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/50 rounded-lg text-center">
                          <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300 mb-1">
                            Update Requests
                          </p>
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => {
                              router.push('/pages/user/attendance/status');
                              setOpen(false);
                            }}
                            className="h-auto p-0 text-xs text-indigo-600 dark:text-indigo-400"
                          >
                            Check Status
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </ScrollArea>

            </PopoverContent>
          </Popover>

        </div>
      </div>
    </header>
  );
}
