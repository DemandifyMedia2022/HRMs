import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "IT Portal - HRMS",
  description: "IT infrastructure and support tools",
}

export default function ITLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
