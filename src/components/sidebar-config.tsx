"use client"

import React, { createContext, useContext, useMemo, useState } from "react"
import type { Icon } from "@tabler/icons-react"

export type UserRole = "admin" | "user" | "hr"

export type NavMainItem = {
  title: string
  url: string
  icon?: Icon
  children?: { title: string; url: string; icon?: Icon }[]
}

export type NavSecondaryItem = {
  title: string
  url: string
  icon: Icon
}

export type DocumentItem = {
  name: string
  url: string
  icon: Icon
  children?: { name: string; url: string; icon?: Icon }[]
}

export type SidebarData = {
  user: {
    name: string
    email: string
    avatar: string
  }
  navMain: NavMainItem[]
  navSecondary: NavSecondaryItem[]
  documents: DocumentItem[]
}

export type SidebarConfig = {
  role: UserRole
  data?: Partial<SidebarData>
}

type Ctx = {
  role: UserRole
  dataOverrides?: Partial<SidebarData>
  setConfig: (cfg: SidebarConfig) => void
}

const SidebarConfigContext = createContext<Ctx | null>(null)

export function SidebarConfigProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole>("user")
  const [dataOverrides, setDataOverrides] = useState<Partial<SidebarData> | undefined>(undefined)

  const value = useMemo<Ctx>(() => ({
    role,
    dataOverrides,
    setConfig: (cfg: SidebarConfig) => {
      setRole(cfg.role)
      setDataOverrides(cfg.data)
    },
  }), [role, dataOverrides])

  return (
    <SidebarConfigContext.Provider value={value}>
      {children}
    </SidebarConfigContext.Provider>
  )
}

export function useSidebarConfig() {
  const ctx = useContext(SidebarConfigContext)
  if (!ctx) throw new Error("useSidebarConfig must be used within SidebarConfigProvider")
  return ctx
}

// Helper component for pages to set the role/config
export function SidebarConfig({ role, data }: SidebarConfig) {
  const { setConfig } = useSidebarConfig()
  React.useEffect(() => {
    setConfig({ role, data })
  }, [role, data, setConfig])
  return null
}
