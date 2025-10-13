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
  IconTicket,
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
      {
        title: "Attendance",
        url: "#",
        icon: IconUsers,
        children: [
          { title: "Attendance", url: "#", icon: IconUsers },
          { title: "Update Attendance", url: "#", icon: IconListDetails },
        ],
      },
      { title: "Leaves", url: "#", icon: IconChartBar },
      {
        title: "Payroll",
        url: "#",
        icon: IconSettings,
        children: [
          { title: "Paylip", url: "#", icon: IconReport },
          { title: "My Salary Structure", url: "#", icon: IconFileDescription },
          { title: "Employee Salary Structure", url: "#", icon: IconFileDescription },
          { title: "Tax", url: "#", icon: IconReport },
        ],
      },
       
    ],
    navSecondary: [
      
      { title: "Settings", url: "#", icon: IconSettings },
    ],
    documents: [
      {
        name: "Campaigns",
        url: "#",
        icon: IconReport,
        children: [
          { name: "All Campaigns", url: "#", icon: IconReport },
          { name: "All Leads", url: "#", icon: IconDatabase },
          { name: "Add Campaigns", url: "#", icon: IconReport },
        ],
      },
      { name: "Events", url: "#", icon: IconDatabase },
      { name: "Requests", url: "#", icon: IconSettings },
    ],
  },
  user: {
    user: { name: "User", email: "user@example.com", avatar: "/avatars/shadcn.jpg" },
    navMain: [
      { title: "Dashboard", url: "#", icon: IconDashboard },
      {
        title: "Attendance",
        url: "#",
        icon: IconListDetails,
        children: [
          { title: "Monthly Attendance", url: "#", icon: IconReport },
          { title: "Request Attendance Update", url: "#", icon: IconListDetails },
          { title: "Attendance update status", url: "#", icon: IconReport },
        ],
      },
      { title: "Leaves", url: "#", icon: IconChartBar },
      {
        title: "Payroll",
        url: "#",
        icon: IconFolder,
        children: [
          { title: "Payslip", url: "#", icon: IconReport },
          { title: "Salary structure", url: "#", icon: IconFileDescription },
        ],
      },
      { title: "Raise Ticket", url: "#", icon: IconTicket },
    ],
    navSecondary: [
      { title: "Settings", url: "#", icon: IconSettings },
     
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
      {
        title: "Attendance",
        url: "#",
        icon: IconUsers,
        children: [
          { title: "Monthly Attendance", url: "#", icon: IconReport },
          { title: "Update Attendance", url: "#", icon: IconListDetails },
          { title: "Assign Shift", url: "#", icon: IconUsers },
          { title: "Request Attendance Update", url: "#", icon: IconListDetails },
          { title: "Attendance Update Status", url: "#", icon: IconReport },
        ],
      },
      { title: "Leaves", url: "#", icon: IconListDetails },
      {
        title: "Payroll",
        url: "#",
        icon: IconReport,
        children: [
          { title: "Paylip", url: "#", icon: IconReport },
          { title: "My Salary Structure", url: "#", icon: IconFileDescription },
          { title: "Employee Salary Structure", url: "#", icon: IconFileDescription },
          { title: "Tax", url: "#", icon: IconReport },
        ],
      },
      { title: "Bank Challan", url: "#", icon: IconFileDescription },
      {
        title: "Employee Details",
        url: "#",
        icon: IconFileDescription,
        children: [
          { title: "Employee Settlement", url: "#", icon: IconFileDescription },
          { title: "Employement Settlement Data", url: "#", icon: IconFileDescription },
        ],
      },
    ],
    navSecondary: [
      { title: "Settings", url: "#", icon: IconSettings },
      
    ],
    documents: [
      { name: "Letter Generation", url: "#", icon: IconFileWord },
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
