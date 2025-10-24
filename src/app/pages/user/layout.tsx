import type { Metadata } from "next"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { verifyToken } from "@/lib/auth"

export const metadata: Metadata = {
  title: "User Portal - HRMS",
  description: "User dashboard and self-service tools",
}

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Server-side guard: only allow user role
  const cookieStore = await cookies()
  const token = cookieStore.get("access_token")?.value
  if (!token) redirect("/")
  try {
    const user = verifyToken(token)
    if (user.role !== "user") redirect("/access-denied")
  } catch {
    redirect("/")
  }
  return <>{children}</>
}
