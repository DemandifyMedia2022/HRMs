"use client"

import { useCallback, useEffect, useState } from "react"
import type { UserRole } from "@/components/sidebar-config"

export type AuthUser = {
  name: string
  email: string
  role: UserRole
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUser = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" })
      if (!res.ok) {
        setUser(null)
      } else {
        const data = await res.json().catch(() => null)
        if (data) {
          const role = String(data.role || "user").toLowerCase() as UserRole
          setUser({ name: data.name || "User", email: data.email || "", role })
        } else {
          setUser(null)
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error")
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  return { user, loading, error, refresh: fetchUser }
}
