import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken, verifyRefreshToken } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Admin Portal - HRMS',
  description: 'Admin dashboard and management tools'
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Server-side guard: only allow admin
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  const refreshToken = cookieStore.get('refresh_token')?.value;
  
  // If no access token, try to refresh if refresh token exists
  if (!token) {
    if (refreshToken) {
      // Redirect to refresh endpoint which will handle token refresh and redirect back
      redirect(`/api/auth/refresh?redirect=${encodeURIComponent('/pages/admin')}`);
    }
    redirect('/access-denied');
  }
  
  try {
    const user = verifyToken(token);
    if (user.role !== 'admin') redirect('/access-denied');
  } catch {
    // Token verification failed, try to refresh if refresh token exists
    if (refreshToken) {
      try {
        verifyRefreshToken(refreshToken);
        // Refresh token is valid, redirect to refresh endpoint
        redirect(`/api/auth/refresh?redirect=${encodeURIComponent('/pages/admin')}`);
      } catch {
        // Both tokens are invalid, redirect to access denied
        redirect('/access-denied');
      }
    } else {
      redirect('/access-denied');
    }
  }
  
  return <>{children}</>;
}
