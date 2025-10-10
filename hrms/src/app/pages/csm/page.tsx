import { SidebarConfig } from "@/components/sidebar-config"

export default function CSMPage() {
  return (
    <>
      <SidebarConfig role="csm" />
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">CSM Dashboard</h1>
        <p className="text-muted-foreground">Welcome to the Customer Success Management portal.</p>
      </div>
    </>
  )
}
