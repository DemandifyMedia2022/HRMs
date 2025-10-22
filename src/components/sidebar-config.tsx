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
 
  const setConfig = React.useCallback((cfg: SidebarConfig) => {
    console.log("🔧 SidebarConfigProvider setConfig called with:", {
      role: cfg.role,
      hasData: !!cfg.data,
      userData: cfg.data?.user
    })
    setRole(cfg.role)
    setDataOverrides(cfg.data)
  }, [])
 
  const value = useMemo<Ctx>(() => {
    console.log("📦 SidebarConfigProvider context value updated:", {
      role,
      hasDataOverrides: !!dataOverrides,
      userInOverrides: dataOverrides?.user
    })
    return {
      role,
      dataOverrides,
      setConfig,
    }
  }, [role, dataOverrides, setConfig])
 
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
    console.log("🔄 SidebarConfig effect triggered with:", { role, data })
    setConfig({ role, data })
  }, [role, data, setConfig])
 
  return null
}