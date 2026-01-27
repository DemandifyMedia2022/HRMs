import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken, verifyRefreshToken } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'HR Portal - HRMS',
  description: 'Human Resources management and tools'
};

export default async function HRLayout({ children }: { children: React.ReactNode }) {
  // Server-side guard: only allow HR
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  const refreshToken = cookieStore.get('refresh_token')?.value;
  
  // If no access token, try to refresh if refresh token exists
  if (!token) {
    if (refreshToken) {
      // Redirect to refresh endpoint which will handle token refresh and redirect back
      redirect(`/api/auth/refresh?redirect=${encodeURIComponent('/pages/hr')}`);
    }
    redirect('/access-denied');
  }
  
  try {
    const user = verifyToken(token);
    if (user.role !== 'hr') redirect('/access-denied');
  } catch {
    // Token verification failed, try to refresh if refresh token exists
    if (refreshToken) {
      try {
        verifyRefreshToken(refreshToken);
        // Refresh token is valid, redirect to refresh endpoint
        redirect(`/api/auth/refresh?redirect=${encodeURIComponent('/pages/hr')}`);
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
