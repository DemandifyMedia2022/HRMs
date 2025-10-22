import { SidebarConfig } from '@/components/sidebar-config';

export default function Page() {
  return (
    <>
      <SidebarConfig role="user" />
      <div className="p-4">
        <h1 className="text-xl font-semibold">User · Leaves</h1>
      </div>
    </>
  );
}
