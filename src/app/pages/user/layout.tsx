import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "User Portal - HRMS",
  description: "User dashboard and self-service tools",
}

export default function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
