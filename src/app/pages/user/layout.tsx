import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken, verifyRefreshToken } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'User Portal - HRMS',
  description: 'User dashboard and self-service tools'
};

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  // Server-side guard: only allow user role
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  const refreshToken = cookieStore.get('refresh_token')?.value;
  
  // If no access token, try to refresh if refresh token exists
  if (!token) {
    if (refreshToken) {
      // Redirect to refresh endpoint which will handle token refresh and redirect back
      redirect(`/api/auth/refresh?redirect=${encodeURIComponent('/pages/user')}`);
    }
    redirect('/');
  }
  
  try {
    const user = verifyToken(token);
    if (user.role !== 'user') redirect('/access-denied');
  } catch {
    // Token verification failed, try to refresh if refresh token exists
    if (refreshToken) {
      try {
        verifyRefreshToken(refreshToken);
        // Refresh token is valid, redirect to refresh endpoint
        redirect(`/api/auth/refresh?redirect=${encodeURIComponent('/pages/user')}`);
      } catch {
        // Both tokens are invalid, redirect to login
        redirect('/');
      }
    } else {
      redirect('/');
    }
  }
  
  return <>{children}</>;
}
