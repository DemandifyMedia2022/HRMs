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
    user: { name: "Loading...", email: "loading@example.com", avatar: "" },
    navMain: [
      { title: "Dashboard", url: "/pages/admin", icon: IconDashboard },
      {
        title: "Attendance",
        url: "#",
        icon: IconUsers,
        children: [
          { title: "Attendance", url: "/pages/admin/attendance", icon: IconUsers },
          { title: "Update Attendance", url: "#", icon: IconListDetails },
        ],
      },
      {
        title: "Leaves",
        url: "#",
        icon: IconChartBar,
        children: [
          { title: "Leaves", url: "/pages/admin/leaves", icon: IconListDetails },
          { title: "Leave Requests", url: "/pages/admin/leaves/request", icon: IconListDetails },
         
        ],
      },
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
      
    ],
  },
  user: {
    user: { name: "Loading...", email: "loading@example.com", avatar: "" },
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
      {
        title: "Leaves",
        url: "#",
        icon: IconChartBar,
        children: [
          { title: "New Leave", url: "/pages/user/leaves/new", icon: IconListDetails },
          { title: "Available Leaves", url: "/pages/user/leaves/available", icon: IconReport },
        ],
      },
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
    user: { name: "Loading...", email: "loading@example.com", avatar: "" },
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
      {
        title: "Leaves",
        url: "#",
        icon: IconListDetails,
        children: [
          { title: "New Leave", url: "/pages/hr/leaves/new", icon: IconListDetails },
          { title: "Available Leaves", url: "/pages/hr/leaves/available", icon: IconReport },
          { title: "All Leaves", url: "/pages/hr/leaves", icon: IconListDetails },
        ],
      },
      {
        title: "Payroll",
        url: "#",
        icon: IconReport,
        children: [
          { title: "Paylip", url: "/pages/hr/payslip", icon: IconReport },
          { title: "My Salary Structure", url: "/pages/hr/payroll/my-salary-structure", icon: IconFileDescription },
          { title: "Employee Salary Structure", url: "/pages/hr/payroll/employee-salary-structure", icon: IconFileDescription },
          { title: "Tax", url: "/pages/hr/payroll/tax", icon: IconReport },
        ],
      },
      { title: "Bank Challan", url: "#", icon: IconFileDescription },
      {
        title: "Employee Details",
        url: "#",
        icon: IconFileDescription,
        children: [
          { title: "Add Employee", url: "/pages/hr/employees/new", icon: IconFileDescription },
          { title: "Employee Settlement", url: "/pages/hr/employees/settlement", icon: IconFileDescription },
          { title: "Settlement History", url: "/pages/hr/employees/history", icon: IconFileDescription },
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
  console.log("🔀 mergeData called with:", { 
    hasOverrides: !!overrides, 
    overridesUser: overrides?.user,
    baseUser: base.user 
  })
  
  if (!overrides) {
    console.log("⚠️ No overrides provided, using base data with:", base.user)
    return base
  }
  
  // If user override is provided, use it with fallback to base for missing fields
  const userData = overrides.user 
    ? {
        name: overrides.user.name ?? base.user.name,
        email: overrides.user.email ?? base.user.email,
        avatar: overrides.user.avatar ?? base.user.avatar
      }
    : base.user
  
  console.log("✅ Merged sidebar data - Final user:", userData)
  
  return {
    user: userData,
    navMain: overrides.navMain ?? base.navMain,
    navSecondary: overrides.navSecondary ?? base.navSecondary,
    documents: overrides.documents ?? base.documents,
  }
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { role, dataOverrides } = useSidebarConfig()
  const base = baseDataByRole[role as keyof typeof baseDataByRole] ?? baseDataByRole.user
  const data = mergeData(base, dataOverrides)
  
  // Debug log to see what data is being used
  console.log("🎨 AppSidebar rendering with:", { 
    role, 
    dataOverrides, 
    finalUserData: data.user,
    hasOverrides: !!dataOverrides,
    overridesUser: dataOverrides?.user
  })
  
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