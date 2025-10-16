"use client"

import React from "react"
import { IconCirclePlusFilled, IconMail, IconChevronDown, IconChevronRight, type Icon } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: Icon
    children?: { title: string; url: string; icon?: Icon }[]
  }[]
}) {
  const [openMap, setOpenMap] = React.useState<Record<string, boolean>>({})
  const toggle = (key: string) => setOpenMap((s) => ({ ...s, [key]: !s[key] }))
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              tooltip="Quick Create"
              className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
            >
              <IconCirclePlusFilled />
              <span>Quick Create</span>
            </SidebarMenuButton>
            <Button
              size="icon"
              className="size-8 group-data-[collapsible=icon]:opacity-0"
              variant="outline"
            >
              <IconMail />
              <span className="sr-only">Inbox</span>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              {item.children && item.children.length ? (
                <>
                  <SidebarMenuButton
                    tooltip={item.title}
                    onClick={() => toggle(item.title)}
                  >
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    {openMap[item.title] ? <IconChevronDown className="ml-auto" /> : <IconChevronRight className="ml-auto" />}
                  </SidebarMenuButton>
                  {openMap[item.title] && (
                    <SidebarMenu className="ml-6 mt-1">
                      {item.children.map((ch) => (
                        <SidebarMenuItem key={`${item.title}_${ch.title}`}>
                          <SidebarMenuButton
                            tooltip={ch.title}
                            onClick={() => {
                              try { window.location.href = ch.url } catch {}
                            }}
                          >
                            {ch.icon && <ch.icon />}
                            <span>{ch.title}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  )}
                </>
              ) : item.url ? (
                // Keep a button element to avoid SSR/CSR mismatches; navigate on click
                <SidebarMenuButton
                  tooltip={item.title}
                  onClick={() => {
                    try {
                      window.location.href = item.url
                    } catch (e) {
                      // noop
                    }
                  }}
                >
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              ) : (
                <SidebarMenuButton tooltip={item.title}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
