"use client"

import {
  type Icon,
} from "@tabler/icons-react"
import { usePathname } from "next/navigation"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavDocuments({
  items,
}: {
  items: {
    name: string
    url: string
    icon: Icon
    children?: { name: string; url: string; icon?: Icon }[]
  }[]
}) {
  const { isMobile } = useSidebar()
  const pathname = usePathname()

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Secondary</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.name}>
            {item.children && item.children.length > 0 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    isActive={item.children.some((c) => c.url !== "#" && pathname.startsWith(c.url))}
                    className={item.children.some((c) => c.url !== "#" && pathname.startsWith(c.url)) ? "rounded-md bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary data-[active=true]:!bg-sidebar-primary data-[active=true]:!text-sidebar-primary-foreground" : "rounded-md"}
                  >
                    <item.icon />
                    <span>{item.name}</span>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-48 rounded-lg"
                  side={isMobile ? "bottom" : "right"}
                  align={isMobile ? "end" : "start"}
                >
                  {item.children.map((child) => (
                    <DropdownMenuItem key={child.name}>
                      <a href={child.url} className={`flex items-center gap-2 ${child.url !== "#" && pathname.startsWith(child.url) ? "font-medium" : ""}`}>
                        {child.icon && <child.icon />}
                        <span>{child.name}</span>
                      </a>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <SidebarMenuButton
                asChild
                isActive={item.url !== "#" && pathname === item.url}
                className={item.url !== "#" && pathname === item.url ? "rounded-md bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary data-[active=true]:!bg-sidebar-primary data-[active=true]:!text-sidebar-primary-foreground" : "rounded-md"}
              >
                <a href={item.url}>
                  <item.icon />
                  <span>{item.name}</span>
                </a>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        ))}
        <SidebarMenuItem>
          {/* <SidebarMenuButton className="text-sidebar-foreground/70">
            <IconDots className="text-sidebar-foreground/70" />
            <span>More</span>
          </SidebarMenuButton> */}
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}
