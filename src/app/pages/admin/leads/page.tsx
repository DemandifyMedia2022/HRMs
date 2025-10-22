'use client';

import { SidebarConfig } from '@/components/sidebar-config';

export default function Page() {
  return (
    <div className="p-4">
      <SidebarConfig role="admin" />
      <h1 className="text-xl font-semibold">Admin · Leads</h1>
    </div>
  );
}
