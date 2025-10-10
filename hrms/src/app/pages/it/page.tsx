import { SidebarConfig } from "@/components/sidebar-config"

export default function ITPage() {
  return (
    <>
      <SidebarConfig role="it" />
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">IT Dashboard</h1>
        <p className="text-muted-foreground">Welcome to the IT portal.</p>
      </div>
    </>
  )
}
