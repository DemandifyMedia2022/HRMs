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
  IconClipboard,
  IconPhoneCall,
  IconCirclePlus,
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
      { title: "Dashboard", url: "/", icon: IconDashboard },
      { title: "Users", url: "/pages/team", icon: IconUsers },
      { title: "Analytics", url: "/pages/crms/analytics", icon: IconChartBar },
      { title: "CRMS", url: "", icon: IconFolder, children: [
        { title: "Campaign List", url: "/pages/crms/campaigns", icon: IconListDetails },
        { title: "Paste call data", url: "/pages/user", icon: IconClipboard },
        { title: "My call data", url: "/pages/crms/my-calls", icon: IconPhoneCall },
      ] as any },
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
      { title: "Dashboard", url: "/", icon: IconDashboard },
      { title: "Lifecycle", url: "#", icon: IconListDetails },
      { title: "Analytics", url: "/pages/crms/analytics", icon: IconChartBar },
      { title: "CRMS", url: "", icon: IconFolder, children: [
        { title: "Campaign List", url: "/pages/crms/campaigns", icon: IconListDetails },
        { title: "Paste call data", url: "/pages/user", icon: IconClipboard },
        { title: "My call data", url: "/pages/crms/my-calls", icon: IconPhoneCall },
      ] as any },
      { title: "Team", url: "/pages/team", icon: IconUsers },
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
      { title: "Dashboard", url: "/", icon: IconDashboard },
      { title: "Employees", url: "#", icon: IconUsers },
      { title: "Recruitment", url: "#", icon: IconListDetails },
      { title: "Analytics", url: "/pages/crms/analytics", icon: IconChartBar },
      { title: "CRMS", url: "", icon: IconFolder, children: [
        { title: "Campaign List", url: "/pages/crms/campaigns", icon: IconListDetails },
        { title: "Paste call data", url: "/pages/user", icon: IconClipboard },
        { title: "My call data", url: "/pages/crms/my-calls", icon: IconPhoneCall },
      ] as any },
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
  // Try to fetch the authenticated user on the client and prefer that info
  const [authUser, setAuthUser] = React.useState<Partial<typeof data.user> | null>(null)
  const [authDept, setAuthDept] = React.useState<string>("")
  const [authRole, setAuthRole] = React.useState<string>("")
  const [authEmail, setAuthEmail] = React.useState<string>("")
  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' })
        if (!mounted) return
        if (res.ok) {
          const j = await res.json()
          setAuthUser({ name: j.name ?? data.user.name, email: j.email ?? data.user.email })
          setAuthDept(String(j.department ?? ''))
          setAuthEmail(String(j.email ?? ''))
          // Prefer job_role over generic role for RBAC checks
          setAuthRole(String(j.job_role ?? j.role ?? j.designation ?? j.title ?? ''))
        } else {
          // fallback to localStorage (used by some pages) if available
          if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('userName')
            if (stored) setAuthUser({ name: stored, email: data.user.email })
            // department unknown in fallback
            setAuthDept("")
          }
        }
      } catch (e) {
        // ignore errors and keep defaults
      }
    })()
    return () => { mounted = false }
  }, [])

  const finalData = authUser ? { ...data, user: { ...data.user, ...(authUser as any) } } : data
  // Build navMain with conditional CRMS children based on department
  const deptLower = (authDept || '').toLowerCase()
  const navMain = React.useMemo(() => {
    const cloned = (finalData.navMain || []).map((it) => ({ ...it })) as any[]
    const idx = cloned.findIndex((it) => String(it.title).toLowerCase() === 'crms')
    if (idx >= 0) {
      const children: Array<{ title: string; url: string }> = Array.isArray(cloned[idx].children) ? [...cloned[idx].children] : []
      const qaIdx = children.findIndex((c) => c.title === 'Quality Audit')
      const addIdx = children.findIndex((c) => c.title === 'Add Campaign')
      const norm = (v: string) => (v || '').toLowerCase().replace(/[\-_]/g, ' ').replace(/\s+/g, ' ').trim()
      const roleNorm = norm(authRole)
      if (deptLower === 'quality') {
        if (qaIdx === -1) children.push({ title: 'Quality Audit', url: '/pages/status' })
        // Remove non-quality items for Quality department
        for (let i = children.length - 1; i >= 0; i--) {
          const t = children[i].title.toLowerCase()
          if (t === 'paste call data' || t === 'my call data') children.splice(i, 1)
        }
      } else {
        if (qaIdx !== -1) children.splice(qaIdx, 1)
      }
      // Add Campaign visibility: allow ONLY these roles (plus explicit allowlist)
      // - Head Of Operation
      // - Assistant Team Lead
      // - Specific allowlist email (legacy)
      const allowAddCampaign =
        roleNorm.includes('head of operation') ||
        roleNorm.includes('assistant team lead') ||
        (String(authEmail || '').toLowerCase() === 'asfiya.pathan@demandifymedia.com')
      if (allowAddCampaign) {
        if (addIdx === -1) children.push({ title: 'Add Campaign', url: '/pages/crms/campaigns/add', icon: IconCirclePlus })
      } else {
        if (addIdx !== -1) children.splice(addIdx, 1)
      }
      cloned[idx].children = children
    }
    return cloned as any
  }, [finalData.navMain, deptLower, authRole])
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
        {/* Primary navigation */}
        <NavMain items={navMain as any} />
        <NavDocuments items={finalData.documents} />

        {/* Secondary simple links (keep minimal, CRMS moved to navMain dropdown) */}
        <NavSecondary items={finalData.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={finalData.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
