'use client';

import * as React from 'react';
import { type Icon } from '@tabler/icons-react';
import { usePathname } from 'next/navigation';

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar';

export function NavSecondary({
  items,
  ...props
}: {
  items: {
    title: string;
    url: string;
    icon: Icon;
  }[];
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const pathname = usePathname();
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map(item => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={item.url !== '#' && pathname === item.url}
                className={
                  item.url !== '#' && pathname === item.url
                    ? 'rounded-md bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary data-[active=true]:!bg-sidebar-primary data-[active=true]:!text-sidebar-primary-foreground'
                    : 'rounded-md'
                }
              >
                <a href={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
