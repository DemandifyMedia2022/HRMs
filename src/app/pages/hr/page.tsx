"use client"

import { SidebarConfig } from "@/components/sidebar-config"

export default function HRPage() {
  return (
    <>
      <SidebarConfig role="hr" />
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">HR Dashboard</h1>
        <p className="text-muted-foreground">Welcome to the HR portal.</p>
      </div>
    </>
  )
}