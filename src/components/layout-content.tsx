'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { SidebarConfigProvider, SidebarConfig, type UserRole } from '@/components/sidebar-config';
import { useAuth } from '@/hooks/useAuth';

// Separate component for pages with sidebar to maintain consistent hook calls
function PageWithSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  const roleFromPath = useMemo<UserRole | undefined>(() => {
    if (pathname.startsWith('/pages/admin')) return 'admin';
    if (pathname.startsWith('/pages/hr')) return 'hr';
    if (pathname.startsWith('/pages/user')) return 'user';
    return undefined;
  }, [pathname]);

  // Memoize user data to ensure stable reference
  const sidebarUserData = useMemo(() => {
    if (!user) {
      console.log('⚠️ No user data available yet');
      return undefined;
    }
    console.log('✅ Creating sidebar user data from:', user);
    return {
      user: {
        name: user.name,
        email: user.email,
        avatar: '' // Empty avatar will use fallback initials
      }
    };
  }, [user]);

  const effectiveRole = roleFromPath ?? user?.role ?? 'user';

  console.log('📍 PageWithSidebar render:', {
    user,
    loading,
    sidebarUserData,
    effectiveRole,
    hasUserData: !!user
  });

  return (
    <>
      <SidebarConfig role={effectiveRole as UserRole} data={sidebarUserData} />
      <SidebarProvider
        style={
          {
            '--sidebar-width': 'calc(var(--spacing) * 72)',
            '--header-height': 'calc(var(--spacing) * 12)'
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          {children}
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const isAccessDenied = pathname === '/access-denied';
  const isForgot = pathname === '/forgot-password';
  const isReset = pathname === '/reset-password';

  return (
    <SidebarConfigProvider>
      {isHomePage || isAccessDenied || isForgot || isReset ? children : <PageWithSidebar>{children}</PageWithSidebar>}
    </SidebarConfigProvider>
  );
}
