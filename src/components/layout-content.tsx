"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { SidebarConfigProvider, SidebarConfig, type UserRole } from "@/components/sidebar-config"

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isHomePage = pathname === "/"
  const [user, setUser] = useState<{ name: string; email: string; role: UserRole } | null>(null)

  useEffect(() => {
    // Load current user to populate sidebar (name/email/role)
    fetch("/api/auth/me", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) return null
        const data = await res.json().catch(() => null)
        if (!data) return null
        const role = String(data.role || "user").toLowerCase() as UserRole
        setUser({ name: data.name || "User", email: data.email || "", role })
        return null
      })
      .catch(() => null)
  }, [pathname])

  if (isHomePage) {
    return (
      <SidebarConfigProvider>
        {children}
      </SidebarConfigProvider>
    )
  }

  return (
    <SidebarConfigProvider>
      {user && (
        <SidebarConfig
          role={user.role}
          data={{ user: { name: user.name, email: user.email, avatar: "/avatars/shadcn.jpg" } }}
        />
      )}
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          {children}
        </SidebarInset>
      </SidebarProvider>
    </SidebarConfigProvider>
  )
}
