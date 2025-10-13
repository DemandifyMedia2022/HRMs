"use client"

import * as React from "react"
import { useSidebarConfig, type SidebarData, type UserRole } from "@/components/sidebar-config"
import {
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const baseDataByRole: Record<UserRole, SidebarData> = {
  admin: {
    user: { name: "Admin", email: "admin@example.com", avatar: "/avatars/shadcn.jpg" },
    navMain: [
      { title: "Dashboard", url: "#", icon: IconDashboard },
      { title: "Users", url: "#", icon: IconUsers },
      { title: "Analytics", url: "#", icon: IconChartBar },
      { title: "Settings", url: "#", icon: IconSettings },
    ],
    navSecondary: [
      { title: "Search", url: "#", icon: IconSearch },
      { title: "Get Help", url: "#", icon: IconHelp },
    ],
    documents: [
      { name: "Reports", url: "#", icon: IconReport },
      { name: "Data Library", url: "#", icon: IconDatabase },
    ],
  },
  user: {
    user: { name: "User", email: "user@example.com", avatar: "/avatars/shadcn.jpg" },
    navMain: [
      { title: "Dashboard", url: "#", icon: IconDashboard },
      { title: "Lifecycle", url: "#", icon: IconListDetails },
      { title: "Analytics", url: "#", icon: IconChartBar },
      { title: "Projects", url: "#", icon: IconFolder },
      { title: "Team", url: "#", icon: IconUsers },
    ],
    navSecondary: [
      { title: "Settings", url: "#", icon: IconSettings },
      { title: "Get Help", url: "#", icon: IconHelp },
      { title: "Search", url: "#", icon: IconSearch },
    ],
    documents: [
      { name: "Data Library", url: "#", icon: IconDatabase },
      { name: "Reports", url: "#", icon: IconReport },
      { name: "Word Assistant", url: "#", icon: IconFileWord },
    ],
  },
  hr: {
    user: { name: "HR", email: "hr@example.com", avatar: "/avatars/shadcn.jpg" },
    navMain: [
      { title: "Dashboard", url: "#", icon: IconDashboard },
      { title: "Employees", url: "#", icon: IconUsers },
      { title: "Recruitment", url: "#", icon: IconListDetails },
      { title: "Payroll", url: "#", icon: IconReport },
      { title: "Leave Management", url: "#", icon: IconFileDescription },
    ],
    navSecondary: [
      { title: "Search", url: "#", icon: IconSearch },
      { title: "Get Help", url: "#", icon: IconHelp },
    ],
    documents: [
      { name: "HR Policies", url: "#", icon: IconFileWord },
      { name: "Employee Handbook", url: "#", icon: IconFileDescription },
      { name: "Reports", url: "#", icon: IconReport },
    ],
  },
}

function mergeData(base: SidebarData, overrides?: Partial<SidebarData>): SidebarData {
  if (!overrides) return base
  return {
    user: { ...base.user, ...(overrides.user ?? {}) },
    navMain: overrides.navMain ?? base.navMain,
    navSecondary: overrides.navSecondary ?? base.navSecondary,
    documents: overrides.documents ?? base.documents,
  }
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { role, dataOverrides } = useSidebarConfig()
  const base = baseDataByRole[role as keyof typeof baseDataByRole] ?? baseDataByRole.user
  const data = mergeData(base, dataOverrides)
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">HRMS</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
