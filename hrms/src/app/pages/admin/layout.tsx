import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Admin Portal - HRMS",
  description: "Admin dashboard and management tools",
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
