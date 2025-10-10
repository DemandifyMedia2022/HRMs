import { SidebarConfig } from "@/components/sidebar-config"

export default function AdminPage() {
  return (
    <>
      <SidebarConfig role="admin" />
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
        <p className="text-muted-foreground">Welcome to the Admin portal.</p>
      </div>
    </>
  )
}
