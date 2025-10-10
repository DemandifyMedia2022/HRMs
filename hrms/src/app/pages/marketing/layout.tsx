import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Marketing Portal - HRMS",
  description: "Marketing campaigns and analytics tools",
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
