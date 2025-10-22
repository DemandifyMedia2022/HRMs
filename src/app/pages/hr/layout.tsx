import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'HR Portal - HRMS',
  description: 'Human Resources management and tools'
};

export default function HRLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
