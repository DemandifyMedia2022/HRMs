import { SidebarConfig } from "@/components/sidebar-config"

export default function SalesPage() {
  return (
    <>
      <SidebarConfig role="sales" />
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Sales Dashboard</h1>
        <p className="text-muted-foreground">Welcome to the Sales portal.</p>
      </div>
    </>
  )
}
