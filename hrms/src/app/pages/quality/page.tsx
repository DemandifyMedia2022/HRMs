import { SidebarConfig } from "@/components/sidebar-config"

export default function QualityPage() {
  return (
    <>
      <SidebarConfig role="quality" />
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Quality Dashboard</h1>
        <p className="text-muted-foreground">Welcome to the Quality portal.</p>
      </div>
    </>
  )
}
