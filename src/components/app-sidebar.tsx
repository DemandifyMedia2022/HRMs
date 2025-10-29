'use client';

import * as React from 'react';
import { useSidebarConfig, type SidebarData, type UserRole } from '@/components/sidebar-config';
import {
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconDialpad,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconPhone,
  IconReport,
  IconSearch,
  IconCalendar,
  IconSettings,
  IconSpeakerphone,
  IconTicket,
  IconUsers,
  IconPlus,
  IconCash,
  IconHistory,
  IconUserCheck,
  IconNotification
} from '@tabler/icons-react';

import { NavDocuments } from '@/components/nav-documents';
import { NavMain } from '@/components/nav-main';
import { NavSecondary } from '@/components/nav-secondary';
import { NavUser } from '@/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/useAuth';

const baseDataByRole: Record<UserRole, SidebarData> = {
  admin: {
    user: { name: 'Loading...', email: 'loading@example.com', avatar: '' },
    navMain: [
      { title: 'Dashboard', url: '/pages/admin', icon: IconDashboard },
      {
        title: 'Attendance',
        url: '#',
        icon: IconCalendar,
        children: [
          { title: 'Attendance', url: '/pages/admin/attendance', icon: IconUsers },
          { title: 'Update Attendance', url: '/pages/admin/attendance/update', icon: IconListDetails },
          { title: 'Requests', url: '/pages/admin/attendance/requests', icon: IconListDetails }
        ]
      },
      {
        title: 'Leaves',
        url: '/pages/admin/leaves',
        icon: IconChartBar
      },
      {
        title: 'Tickets',
        url: '#',
        icon: IconTicket,
        children: [
          { title: 'Raise Ticket', url: '/pages/admin/tickets/raise', icon: IconReport },
          { title: 'Ticket Status', url: '/pages/admin/tickets/status', icon: IconFileDescription }
        ]
      },
      {
        title: 'Payroll',
        url: '#',
        icon: IconSettings,
        children: [
          { title: 'Paylip', url: '/pages/admin/payroll/payslip', icon: IconReport },
          { title: 'My Salary Structure', url: '/pages/admin/payroll/my-salary-structure', icon: IconFileDescription },
          {
            title: 'Employee Salary Structure',
            url: '/pages/admin/payroll/employee-salary-structure',
            icon: IconFileDescription
          },
          { title: 'Tax', url: '/pages/admin/payroll/tax', icon: IconReport }
        ]
      },
      {
        title: 'Employee Details',
        url: '#',
        icon: IconUsers,
        children: [
          { title: 'All Employees', url: '/pages/admin/employees/employee-details', icon: IconUsers },
          { title: 'Add Employee', url: '/pages/admin/employees/new', icon: IconPlus },
          { title: 'Employee Settlement', url: '/pages/admin/employees/settlement', icon: IconUserCheck },
          { title: 'Settlement History', url: '/pages/admin/employees/history', icon: IconHistory }
        ]
      }
    ],
    navSecondary: [{ title: 'Notifications', url: '/pages/notifications', icon: IconNotification }],
    documents: [
      {
        name: 'Campaigns',
        url: '#',
        icon: IconSpeakerphone,
        children: [
          { name: 'Campaign list', url: '/pages/admin/campaigns', icon: IconReport },
          { name: 'Add Campaigns', url: '/pages/admin/campaigns/add', icon: IconPlus },
          { name: 'Call Data', url: '/pages/admin/call-data', icon: IconDatabase },
          { name: 'Paste Call Data', url: '/pages/admin/paste-call-data', icon: IconDialpad }
        ]
      },
      { name: 'Team', url: '/pages/admin/team', icon: IconUsers }
    ]
  },
  user: {
    user: { name: 'Loading...', email: 'loading@example.com', avatar: '' },
    navMain: [
      { title: 'Dashboard', url: '/pages/user', icon: IconDashboard },
      {
        title: 'Attendance',
        url: '#',
        icon: IconListDetails,
        children: [
          { title: 'Monthly Attendance', url: '/pages/user/attendance', icon: IconReport },
          { title: 'Request Attendance Update', url: '/pages/user/attendance/request-update', icon: IconListDetails },
          { title: 'Attendance update status', url: '/pages/user/attendance/status', icon: IconReport }
        ]
      },
      {
        title: 'Leaves',
        url: '#',
        icon: IconChartBar,
        children: [
          { title: 'New Leave', url: '/pages/user/leaves/new', icon: IconListDetails },
          { title: 'Available Leaves', url: '/pages/user/leaves/available', icon: IconReport }
        ]
      },
      {
        title: 'Payroll',
        url: '#',
        icon: IconFolder,
        children: [
          { title: 'Payslip', url: '/pages/user/payroll/payslip', icon: IconReport },
          { title: 'Salary structure', url: '/pages/user/payroll/salary-structure', icon: IconFileDescription }
        ]
      },
      {
        title: 'Ticket',
        url: '#',
        icon: IconTicket,
        children: [
          { title: 'Raise Ticket', url: '/pages/user/tickets/raise', icon: IconReport },
          { title: 'Ticket Status', url: '/pages/user/tickets/status', icon: IconFileDescription }
        ]
      }
    ],
    navSecondary: [{ title: ' Notifications', url: '/pages/notifications', icon: IconNotification }],
    documents: [
      {
        name: 'Operation',
        url: '#',
        icon: IconPhone,
        children: [
          { name: 'Team', url: '/pages/user/operations/extensions', icon: IconUsers },
          { name: 'Paste Call Data', url: '/pages/user/operations/paste-call-data', icon: IconReport },
          { name: 'Call History', url: '/pages/user/operations/calls', icon: IconFileWord },
          { name: 'Analytics', url: '/pages/user/operations/call-analytics', icon: IconChartBar },
          { name: 'Campaigns', url: '/pages/user/operations/campaigns', icon: IconDatabase }
        ]
      },
      {
        name: 'Quality',
        url: '#',
        icon: IconReport,
        children: [
          { name: 'Quality Audit', url: '/pages/user/quality', icon: IconReport },
          { name: 'Campaign List', url: '/pages/user/quality/campaigns', icon: IconSpeakerphone },
          { name: 'Analytics', url: '/pages/user/quality/analytics', icon: IconReport }
        ]
      },
      {
        name: 'Team Lead',
        url: '#',
        icon: IconUsers,
        children: [
          { name: 'Campaigns', url: '/pages/user/team-lead/campaigns', icon: IconSpeakerphone },
          { name: 'Add Campaign', url: '/pages/user/team-lead/add', icon: IconPlus },
          { name: 'Analytics', url: '/pages/user/team-lead/analytics', icon: IconReport },
          { name: 'Team', url: '/pages/user/team-lead/team', icon: IconUsers },
          { name: 'Paste Call Data', url: '/pages/user/team-lead/paste-call-data', icon: IconReport },
          { name: 'Call History', url: '/pages/user/team-lead/call-data', icon: IconDatabase }
        ]
      }
      // { name: "Team", url: "/pages/user/team", icon: IconUsers },
      // { name: "Campaigns", url: "/pages/user/campaigns", icon: IconSpeakerphone },
    ]
  },
  hr: {
    user: { name: 'Loading...', email: 'loading@example.com', avatar: '' },
    navMain: [
      { title: 'Dashboard', url: '/pages/hr', icon: IconDashboard },
      {
        title: 'Attendance',
        url: '#',
        icon: IconUsers,
        children: [
          { title: 'Monthly Attendance', url: '/pages/hr/attendance', icon: IconReport },
          { title: 'Update Attendance', url: '/pages/hr/attendance/update', icon: IconListDetails },
          { title: 'Assign Shift', url: '/pages/hr/attendance/assign-shift', icon: IconUsers },
          { title: 'Request Attendance Update', url: '/pages/hr/attendance/request-update', icon: IconListDetails },
          { title: 'Attendance Update Status', url: '/pages/hr/attendance/status', icon: IconReport }
        ]
      },
      {
        title: 'Leaves',
        url: '#',
        icon: IconListDetails,
        children: [
          { title: 'New Leave', url: '/pages/hr/leaves/new', icon: IconListDetails },
          { title: 'Available Leaves', url: '/pages/hr/leaves/available', icon: IconReport },
          { title: 'All Leaves', url: '/pages/hr/leaves', icon: IconListDetails }
        ]
      },
      {
        title: 'Payroll',
        url: '#',
        icon: IconReport,
        children: [
          { title: 'Payslip', url: '/pages/hr/payroll/payslip', icon: IconReport },
          { title: 'My Salary Structure', url: '/pages/hr/payroll/my-salary-structure', icon: IconFileDescription },
          {
            title: 'Employee Salary Structure',
            url: '/pages/hr/payroll/employee-salary-structure',
            icon: IconFileDescription
          },
          { title: 'Employee Expenses', url: '/pages/hr/payroll/tax', icon: IconReport }
        ]
      },
      {
        title: 'Tickets',
        url: '#',
        icon: IconTicket,
        children: [
          { title: 'Raise Ticket', url: '/pages/hr/tickets/raise', icon: IconReport },
          { title: 'Ticket Status', url: '/pages/hr/tickets/status', icon: IconFileDescription }
        ]
      },
      { title: 'Bank Challan', url: '/pages/hr/bank-challan', icon: IconCash },
      {
        title: 'Employee Details',
        url: '#',
        icon: IconFileDescription,
        children: [
          { title: 'All Employees', url: '/pages/hr/employees/employee-details', icon: IconFileDescription },
          { title: 'Add Employee', url: '/pages/hr/employees/new', icon: IconFileDescription },
          { title: 'Employee Settlement', url: '/pages/hr/employees/settlement', icon: IconFileDescription },
          { title: 'Settlement History', url: '/pages/hr/employees/history', icon: IconFileDescription }
        ]
      }
    ],
    navSecondary: [{ title: 'Notifications', url: '/pages/notifications', icon: IconNotification }],
    documents: [
      { name: 'Letter Generation', url: '/pages/hr/letter-generation', icon: IconFileWord },
      { name: 'Events', url: '/pages/hr/events', icon: IconCalendar }
    ]
  }
};

function mergeData(base: SidebarData, overrides?: Partial<SidebarData>): SidebarData {
  // console.log("🔀 mergeData called with:", {
  //   hasOverrides: !!overrides,
  //   overridesUser: overrides?.user,
  //   baseUser: base.user
  // })

  if (!overrides) {
    // console.log("⚠️ No overrides provided, using base data with:", base.user)
    return base;
  }

  // If user override is provided, use it with fallback to base for missing fields
  const userData = overrides.user
    ? {
        name: overrides.user.name ?? base.user.name,
        email: overrides.user.email ?? base.user.email,
        avatar: overrides.user.avatar ?? base.user.avatar
      }
    : base.user;

  // console.log("✅ Merged sidebar data - Final user:", userData)

  return {
    user: userData,
    navMain: overrides.navMain ?? base.navMain,
    navSecondary: overrides.navSecondary ?? base.navSecondary,
    documents: overrides.documents ?? base.documents
  };
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { role, dataOverrides } = useSidebarConfig();
  const base = baseDataByRole[role as keyof typeof baseDataByRole] ?? baseDataByRole.user;
  const data = mergeData(base, dataOverrides);
  const { user } = useAuth();

  const allowedTeamLeadEmails = React.useMemo(
    () => new Set(['asfiya.pathan@demandifymedia.com', 'tejal.kamble@demandifymedia.com']),
    []
  );

  const filteredDocuments = React.useMemo(() => {
    const dept = (user?.department || '').toLowerCase();
    const email = (user?.email || '').toLowerCase();

    return (data.documents || []).filter(section => {
      const name = section.name.toLowerCase();
      if (name === 'operation') {
        return dept === 'operation';
      }
      if (name === 'quality') {
        return dept === 'quality' || dept === 'quality analyst';
      }
      if (name === 'team lead') {
        return allowedTeamLeadEmails.has(email);
      }
      return true;
    });
  }, [data.documents, user?.department, user?.email, allowedTeamLeadEmails]);

  // Debug log to see what data is being used
  // console.log("🎨 AppSidebar rendering with:", {
  //   role,
  //   dataOverrides,
  //   finalUserData: data.user,
  //   hasOverrides: !!dataOverrides,
  //   overridesUser: dataOverrides?.user
  // })

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
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
        <NavDocuments items={filteredDocuments} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
