import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Department Portals - HRMS',
  description: 'Access department-specific portals and tools'
};

export default function PagesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
