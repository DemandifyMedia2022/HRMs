"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "./useAuth"

export function useRouteGuard(requiredRole?: "admin" | "hr" | "user") {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (loading) return

    // If no user, navigate to Access Denied (server will also handle via middleware/layout)
    if (!user) {
      router.push("/access-denied")
      return
    }

    // If a specific role is required and user doesn't have it, go to Access Denied
    if (requiredRole && user.role !== requiredRole) {
      router.push("/access-denied")
      return
    }

    // Additional check: prevent users from accessing other users' pages
    if (user.role === "user" && pathname.startsWith("/pages/user")) {
      // User is in correct area, allow access
      return
    }

    if (user.role === "hr" && pathname.startsWith("/pages/hr")) {
      // HR is in correct area, allow access
      return
    }

    if (user.role === "admin" && pathname.startsWith("/pages/admin")) {
      // Admin is in correct area, allow access
      return
    }

    // If user is trying to access a protected area they shouldn't be in
    if (
      (pathname.startsWith("/pages/admin") && user.role !== "admin") ||
      (pathname.startsWith("/pages/hr") && user.role !== "hr") ||
      (pathname.startsWith("/pages/user") && user.role !== "user")
    ) {
      // Go to Access Denied to avoid flicker and be consistent with middleware
      router.push("/access-denied")
    }
  }, [user, loading, requiredRole, router, pathname])

  return { user, loading }
}