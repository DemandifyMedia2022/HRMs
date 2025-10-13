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
      { title: "Dashboard", url: "/pages/admin", icon: IconDashboard },
      {
        title: "Attendance",
        url: "#",
        icon: IconUsers,
        children: [
          { title: "Monthly Attendance", url: "/pages/admin/attendance", icon: IconUsers },
          { title: "Update Attendance", url: "/pages/admin/attendance/update", icon: IconListDetails },
        ],
      },
      { title: "Leaves", url: "/pages/admin/leaves", icon: IconChartBar },
      {
        title: "Payroll",
        url: "#",
        icon: IconSettings,
        children: [
          { title: "Paylip", url: "/pages/admin/payroll/payslip", icon: IconReport },
          { title: "My Salary Structure", url: "/pages/admin/payroll/my-salary-structure", icon: IconFileDescription },
          { title: "Employee Salary Structure", url: "/pages/admin/payroll/employee-salary-structure", icon: IconFileDescription },
          { title: "Tax", url: "/pages/admin/payroll/tax", icon: IconReport },
        ],
      },
       
    ],
    navSecondary: [
      
      { title: "Settings", url: "/pages/admin/settings", icon: IconSettings },
    ],
    documents: [
      {
        name: "Campaigns",
        url: "#",
        icon: IconReport,
        children: [
          { name: "All Campaigns", url: "/pages/admin/campaigns", icon: IconReport },
          { name: "All Leads", url: "/pages/admin/leads", icon: IconDatabase },
          { name: "Add Campaigns", url: "/pages/admin/campaigns/add", icon: IconReport },
        ],
      },
      { name: "Events", url: "/pages/admin/events", icon: IconDatabase },
      { name: "Requests", url: "/pages/admin/requests", icon: IconSettings },
    ],
  },
  user: {
    user: { name: "User", email: "user@example.com", avatar: "/avatars/shadcn.jpg" },
    navMain: [
      { title: "Dashboard", url: "/pages/user", icon: IconDashboard },
      {
        title: "Attendance",
        url: "#",
        icon: IconListDetails,
        children: [
          { title: "Monthly Attendance", url: "/pages/user/attendance", icon: IconReport },
          { title: "Request Attendance Update", url: "/pages/user/attendance/request-update", icon: IconListDetails },
          { title: "Attendance update status", url: "/pages/user/attendance/status", icon: IconReport },
        ],
      },
      { title: "Leaves", url: "/pages/user/leaves", icon: IconChartBar },
      {
        title: "Payroll",
        url: "#",
        icon: IconFolder,
        children: [
          { title: "Payslip", url: "/pages/user/payroll/payslip", icon: IconReport },
          { title: "Salary structure", url: "/pages/user/payroll/salary-structure", icon: IconFileDescription },
        ],
      },
      { title: "Raise Ticket", url: "/pages/user/tickets/raise", icon: IconTicket },
    ],
    navSecondary: [
      { title: "Settings", url: "/pages/user/settings", icon: IconSettings },
     
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
      { title: "Dashboard", url: "/pages/hr", icon: IconDashboard },
      {
        title: "Attendance",
        url: "#",
        icon: IconUsers,
        children: [
          { title: "Monthly Attendance", url: "/pages/hr/attendance", icon: IconReport },
          { title: "Update Attendance", url: "/pages/hr/attendance/update", icon: IconListDetails },
          { title: "Assign Shift", url: "/pages/hr/attendance/assign-shift", icon: IconUsers },
          { title: "Request Attendance Update", url: "/pages/hr/attendance/request-update", icon: IconListDetails },
          { title: "Attendance Update Status", url: "/pages/hr/attendance/status", icon: IconReport },
        ],
      },
      { title: "Leaves", url: "/pages/hr/leaves", icon: IconListDetails },
      {
        title: "Payroll",
        url: "#",
        icon: IconReport,
        children: [
          { title: "Paylip", url: "/pages/hr/payroll/payslip", icon: IconReport },
          { title: "My Salary Structure", url: "/pages/hr/payroll/my-salary-structure", icon: IconFileDescription },
          { title: "Employee Salary Structure", url: "/pages/hr/payroll/employee-salary-structure", icon: IconFileDescription },
          { title: "Tax", url: "/pages/hr/payroll/tax", icon: IconReport },
        ],
      },
      { title: "Bank Challan", url: "/pages/hr/bank-challan", icon: IconFileDescription },
      {
        title: "Employee Details",
        url: "#",
        icon: IconFileDescription,
        children: [
          { title: "Employee Settlement", url: "/pages/hr/employees/settlement", icon: IconFileDescription },
          { title: "Employement Settlement Data", url: "/pages/hr/employees/settlement-data", icon: IconFileDescription },
        ],
      },
    ],
    navSecondary: [
      { title: "Settings", url: "/pages/hr/settings", icon: IconSettings },
      
    ],
    documents: [
      { name: "Letter Generation", url: "/pages/hr/letters", icon: IconFileWord },
      { name: "Employee Handbook", url: "/pages/hr/handbook", icon: IconFileDescription },
      { name: "Reports", url: "/pages/hr/reports", icon: IconReport },
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
