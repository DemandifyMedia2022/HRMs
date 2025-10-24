import type { Metadata } from "next"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { verifyToken } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Admin Portal - HRMS",
  description: "Admin dashboard and management tools",
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Server-side guard: only allow admin
  const cookieStore = await cookies()
  const token = cookieStore.get("access_token")?.value
  if (!token) redirect("/access-denied")
  try {
    const user = verifyToken(token)
    if (user.role !== "admin") redirect("/access-denied")
  } catch {
    redirect("/access-denied")
  }
  return <>{children}</>
}
