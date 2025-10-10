import { SidebarConfig } from "@/components/sidebar-config"

export default function UserPage() {
  return (
    <>
      <SidebarConfig role="user" />
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">User Dashboard</h1>
        <p className="text-muted-foreground">Welcome to the User portal.</p>
      </div>
    </>
  )
}
