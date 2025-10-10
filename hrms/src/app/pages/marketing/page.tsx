import { SidebarConfig } from "@/components/sidebar-config"

export default function MarketingPage() {
  return (
    <>
      <SidebarConfig role="marketing" />
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Marketing Dashboard</h1>
        <p className="text-muted-foreground">Welcome to the Marketing portal.</p>
      </div>
    </>
  )
}
