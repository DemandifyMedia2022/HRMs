import type { Metadata } from "next"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { verifyToken } from "@/lib/auth"

export const metadata: Metadata = {
  title: "HR Portal - HRMS",
  description: "Human Resources management and tools",
}

export default async function HRLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Server-side guard: only allow HR
  const cookieStore = await cookies()
  const token = cookieStore.get("access_token")?.value
  if (!token) redirect("/access-denied")
  try {
    const user = verifyToken(token)
    if (user.role !== "hr") redirect("/access-denied")
  } catch {
    redirect("/access-denied")
  }
  return <>{children}</>
}
