'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebarConfig, type SidebarData, type UserRole } from '@/components/sidebar-config';

import {
  IconBrandLinkedin,
  IconBuilding,
  IconMessageCircle,
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
  IconNotification,
  IconList,
  IconClock,
  IconBriefcase,
  IconMessage,
  IconChecklist,
  IconProgressCheck,
  IconClipboardList,
  IconMail
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
          { title: 'Requests', url: '/pages/admin/attendance/requests', icon: IconListDetails },
          { title: 'Allocate Shift', url: '/pages/admin/attendance/assign-shift', icon: IconClock },
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
        title: 'Feedback',
        url: '#',
        icon: IconChartBar,
        children: [
          { title: 'Feedbacks', url: '/pages/admin/survey-feedbacks', icon: IconReport },
          { title: 'Feedback Form', url: '/pages/admin/survey-form', icon: IconReport },
          {
            title: 'Ambition Box',
            url: 'https://www.ambitionbox.com/overview/demandify-media-overview',
            icon: IconBriefcase,
            target: '_blank'
          },
          {
            title: 'Glassdoor',
            url: 'https://www.glassdoor.co.in/Reviews/Demandify-Media-Pune-Reviews-EI_IE7737262.0,15_IL.16,20_IM1072.htm',
            icon: IconBuilding,
            target: '_blank'
          },
          {
            title: 'LinkedIn',
            url: 'https://www.linkedin.com/company/demandify-media/posts/?feedView=all',
            icon: IconBrandLinkedin,
            target: '_blank'
          },
          {
            title: 'Reviews',
            url: 'https://www.google.com/search?sca_esv=93a174fe12d6b49e&si=AMgyJEtREmoPL4P1I5IDCfuA8gybfVI2d5Uj7QMwYCZHKDZ-EwvFFJ6LJHDmKnpuo-yrXmQg6fLqNR2XgAtLyU1udHoQ8EyhsT29mVSwT7AdJEJ9cYAp3GdV_639YwuFU-gfwhf3t9oLrs7Qxvl-Dp2v7XKQFNXdig%3D%3D&q=Demandify+A+Trescon+Company+Reviews&sa=X&ved=2ahUKEwjy0LTb2Z6RAxXgbvUHHb8zAfwQ0bkNegQIJxAD&biw=1366&bih=641&dpr=1',
            icon: IconMessageCircle,
            target: '_blank'
          }
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
    navSecondary: [],
    documents: [
      {
        name: 'Task Manager',
        url: '/pages/admin/task-tracking/tasks',
        icon: IconChecklist
      },
      {
        name: 'Operation',
        url: '#',
        icon: IconPhone,
        children: [
          { name: 'Team', url: '/pages/user/operations/extensions', icon: IconUsers },
          { name: 'Paste Call Data', url: '/pages/user/operations/paste-call-data', icon: IconReport },
          { name: 'Records', url: '/pages/user/operations/records', icon: IconList },
                    { name: 'Analytics', url: '/pages/user/operations/call-analytics', icon: IconChartBar },
          { name: 'Campaigns', url: '/pages/user/operations/campaigns', icon: IconDatabase }
        ]
      },
      {
        name: 'Operation',
        url: '#',
        icon: IconPhone,
        children: [
          { name: 'Team', url: '/pages/user/operations/extensions', icon: IconUsers },
          { name: 'Paste Call Data', url: '/pages/user/operations/paste-call-data', icon: IconReport },
          { name: 'Analytics', url: '/pages/user/operations/call-analytics', icon: IconChartBar },
          { name: 'Campaigns', url: '/pages/user/operations/campaigns', icon: IconDatabase }
        ]
      },
      // { name: 'Team', url: '/pages/admin/team', icon: IconUsers }
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
      },
      {
        title: 'Feedback',
        url: '#',
        icon: IconChartBar,
        children: [
          { title: 'Feedback Form', url: '/pages/user/survey-form', icon: IconReport },
          {
            title: 'Ambition Box',
            url: 'https://www.ambitionbox.com/overview/demandify-media-overview',
            icon: IconBriefcase,
            target: '_blank'
          },

        ]
      }
    ],
    navSecondary: [],
    documents: [
      {
        name: 'Task Manager',
        url: '#',
        icon: IconChecklist,
        children: [
          { name: 'Task Progress', url: '/pages/user/task-tracking/task-progress', icon: IconProgressCheck },
          { name: 'My Tasks', url: '/pages/user/task-tracking/my-tasks', icon: IconClipboardList },
        ]
      },
      {
        name: 'Operation',
        url: '#',
        icon: IconPhone,
        children: [
          { name: 'Team', url: '/pages/user/operations/extensions', icon: IconUsers },
          { name: 'Paste Call Data', url: '/pages/user/operations/paste-call-data', icon: IconReport },
          { name: 'Records', url: '/pages/user/operations/records', icon: IconList },
                    { name: 'Analytics', url: '/pages/user/operations/call-analytics', icon: IconChartBar },
          { name: 'Campaigns', url: '/pages/user/operations/campaigns', icon: IconDatabase }
        ]
      },
      // {
      //   name: 'Quality',
      //   url: '#',
      //   icon: IconReport,
      //   children: [
      //     { name: 'Quality Audit', url: '/pages/user/quality', icon: IconReport },
      //     { name: 'Campaign List', url: '/pages/user/quality/campaigns', icon: IconSpeakerphone },
      //     { name: 'Analytics', url: '/pages/user/quality/analytics', icon: IconReport }
      //   ]
      // },
      // {
      //   name: 'Team Lead',
      //   url: '#',
      //   icon: IconUsers,
      //   children: [
      //     { name: 'Campaigns', url: '/pages/user/team-lead/campaigns', icon: IconSpeakerphone },
      //     { name: 'Add Campaign', url: '/pages/user/team-lead/add', icon: IconPlus },
      //     { name: 'Analytics', url: '/pages/user/team-lead/analytics', icon: IconReport },
      //     { name: 'Team', url: '/pages/user/team-lead/team', icon: IconUsers },
      //     { name: 'Paste Call Data', url: '/pages/user/team-lead/paste-call-data', icon: IconReport },
      //     { name: 'Call History', url: '/pages/user/team-lead/call-data', icon: IconDatabase }
      //   ]
      // }
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
          { title: 'Employee Expenses', url: '/pages/hr/payroll/tax', icon: IconReport },

          {title : 'Finalize Attendance', url: '/pages/hr/payroll/finalize', icon: IconReport}
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
        title: 'Feedback',
        url: '#',
        icon: IconChartBar,
        children: [
          { title: 'Feedbacks', url: '/pages/hr/survey-feedbacks', icon: IconReport },

          { title: 'Feedback Form', url: '/pages/hr/survey-form', icon: IconReport },
          // { title: 'Ambition Box', url: 'https://www.ambitionbox.com/overview/demandify-media-overview', icon: IconBriefcase }

        ]
      },
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
    navSecondary: [],
    documents: [
      { name: 'Task Manager', url: '/pages/hr/task-tracking/tasks', icon: IconChecklist },
      { name: 'Letter Generation', url: '/pages/hr/letter-generation', icon: IconMail },
      { name: 'Events', url: '/pages/hr/events', icon: IconCalendar },
      {
        name: 'Operation',
        url: '#',
        icon: IconPhone,
        children: [
          { name: 'Team', url: '/pages/user/operations/extensions', icon: IconUsers },
          { name: 'Paste Call Data', url: '/pages/user/operations/paste-call-data', icon: IconReport },
          { name: 'Records', url: '/pages/user/operations/records', icon: IconList },
                    { name: 'Analytics', url: '/pages/user/operations/call-analytics', icon: IconChartBar },
          { name: 'Campaigns', url: '/pages/user/operations/campaigns', icon: IconDatabase }
        ]
      }
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
  const { user } = useAuth();
  const pathname = usePathname();

  // Prefer the authenticated user's role when available to avoid briefly
  // rendering the wrong sidebar (e.g. user sidebar on HR/admin routes).
  let effectiveRole: UserRole = (user?.role as UserRole) ?? role;

  if (!user) {
    if (pathname.startsWith('/pages/admin')) {
      effectiveRole = 'admin';
    } else if (pathname.startsWith('/pages/hr')) {
      effectiveRole = 'hr';
    } else {
      effectiveRole = 'user';
    }
  }

  const base = baseDataByRole[effectiveRole as keyof typeof baseDataByRole] ?? baseDataByRole.user;

  // Create user data from auth hook to replace the static "Loading..." base
  const authUserData = React.useMemo(() => {
    if (!user) return undefined;
    return {
      name: user.name,
      email: user.email,
      avatar: user.profile_image
        ? (user.profile_image.startsWith('http') || user.profile_image.startsWith('/')
          ? user.profile_image
          : `/api/files/${user.profile_image}`)
        : (user.name || '?').charAt(0)
    };
  }, [user]);

  const effectiveBase = {
    ...base,
    user: authUserData || base.user
  };

  const data = mergeData(effectiveBase, dataOverrides);

  const dashboardUrl = React.useMemo(() => {
    switch (effectiveRole) {
      case 'admin':
        return '/pages/admin';
      case 'hr':
        return '/pages/hr';
      case 'user':
      default:
        return '/pages/user';
    }
  }, [effectiveRole]);

  const allowedTeamLeadEmails = React.useMemo(
    () => new Set(['asfiya.pathan@demandifymedia.com', 'tejal.kamble@demandifymedia.com']),
    []
  );

  const filteredDocuments = React.useMemo(() => {
    const dept = (user?.department || '').toLowerCase();
    const email = (user?.email || '').toLowerCase();

    return (data.documents || []).filter(section => {
      const name = section.name.toLowerCase();

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
              <Link href={dashboardUrl} className="flex items-center gap-3">
                <div className="relative h-8 w-8 rounded-md bg-white/5 flex items-center justify-center overflow-hidden">
                  <Image
                    src="/HRMS-Logo.svg"
                    alt="HRMS logo"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-lg font-semibold tracking-tight">HRMS</span>

                </div>
              </Link>
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
