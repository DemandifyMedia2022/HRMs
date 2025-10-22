'use client';

import { IconCirclePlusFilled, IconMail, type Icon } from '@tabler/icons-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

export function NavMain({
  items
}: {
  items: {
    title: string;
    url: string;
    icon?: Icon;
    children?: { title: string; url: string; icon?: Icon }[];
  }[];
}) {
  const pathname = usePathname();
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu></SidebarMenu>
        <SidebarMenu>
          {items.map(item => {
            const hasChildren = !!(item.children && item.children.length > 0);
            const childActive = hasChildren
              ? item.children!.some(c => c.url !== '#' && pathname.startsWith(c.url))
              : false;
            const isActive = (!hasChildren && item.url !== '#' && pathname === item.url) || childActive;
            const activeCls = isActive
              ? 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary data-[active=true]:!bg-sidebar-primary data-[active=true]:!text-sidebar-primary-foreground'
              : '';
            return (
              <SidebarMenuItem key={item.title}>
                {hasChildren ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuButton tooltip={item.title} isActive={isActive} className={activeCls}>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" sideOffset={8}>
                      {item.children!.map(child => (
                        <DropdownMenuItem asChild key={child.title}>
                          <Link
                            href={child.url}
                            className={`flex items-center gap-2 ${
                              child.url !== '#' && pathname.startsWith(child.url) ? 'font-medium' : ''
                            }`}
                          >
                            {child.icon && <child.icon />}
                            <span>{child.title}</span>
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <SidebarMenuButton tooltip={item.title} asChild isActive={isActive} className={activeCls}>
                    <Link href={item.url}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
