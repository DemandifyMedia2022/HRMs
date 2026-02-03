'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from './useAuth';
import type { UserRole } from '@/components/sidebar-config';

export function useRouteGuard(requiredRole?: UserRole) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    // If no user, redirect to login
    if (!user) {
      router.push('/');
      return;
    }

    // If a specific role is required and user doesn't have it, redirect to their dashboard
    if (requiredRole && user.role !== requiredRole) {
      if (user.role === 'admin' || user.role === 'superadmin') {
        router.push('/pages/admin');
      } else if (user.role === 'hr') {
        router.push('/pages/hr');
      } else {
        router.push('/pages/user');
      }
      return;
    }

    // Additional check: prevent users from accessing other users' pages
    if (user.role === 'user' && pathname.startsWith('/pages/user')) {
      // User is in correct area, allow access
      return;
    }

    if (user.role === 'hr' && pathname.startsWith('/pages/hr')) {
      // HR is in correct area, allow access
      return;
    }

    if ((user.role === 'admin' || user.role === 'superadmin') && pathname.startsWith('/pages/admin')) {
      // Admin is in correct area, allow access
      return;
    }

    // If user is trying to access a protected area they shouldn't be in
    if (
      (pathname.startsWith('/pages/admin') && user.role !== 'admin' && user.role !== 'superadmin') ||
      (pathname.startsWith('/pages/hr') && user.role !== 'hr') ||
      (pathname.startsWith('/pages/user') && user.role !== 'user')
    ) {
      // Redirect to their appropriate dashboard
      if (user.role === 'admin' || user.role === 'superadmin') {
        router.push('/pages/admin');
      } else if (user.role === 'hr') {
        router.push('/pages/hr');
      } else {
        router.push('/pages/user');
      }
    }
  }, [user, loading, requiredRole, router, pathname]);

  return { user, loading };
}
