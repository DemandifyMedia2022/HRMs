"use client"
 
import { SidebarConfig } from "@/components/sidebar-config"
import { useRouteGuard } from "@/hooks/useRouteGuard"
 
export default function AdminPage() {
  const { user, loading } = useRouteGuard("admin")
 
  if (loading) {
    return (
      <div className="p-6">
        <p>Loading...</p>
      </div>
    )
  }
 
  if (!user) return null
 
  return (
    <>
      <SidebarConfig role="admin" />
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
        <p className="text-muted-foreground">Welcome to the Admin portal, {user.name}.</p>
      </div>
    </>
  )
}