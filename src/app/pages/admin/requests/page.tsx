import { SidebarConfig } from '@/components/sidebar-config';

export default function Page() {
  return (
    <>
      <SidebarConfig role="admin" />
      <div className="p-4">
        <h1 className="text-xl font-semibold">Admin · Requests</h1>
      </div>
    </>
  );
}
