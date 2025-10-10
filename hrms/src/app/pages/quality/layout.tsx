import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Quality Portal - HRMS",
  description: "Quality assurance and management tools",
}

export default function QualityLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
