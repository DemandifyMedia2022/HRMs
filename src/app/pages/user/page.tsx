"use client"
 
import { SidebarConfig } from "@/components/sidebar-config"
import { useRouteGuard } from "@/hooks/useRouteGuard"
 
export default function UserPage() {
  const { user, loading } = useRouteGuard("user")
 
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
      <SidebarConfig role="user" />
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">User Dashboard</h1>
        <p className="text-muted-foreground">Welcome Back, {user.name}.</p>
      </div>
    </>
  )
}