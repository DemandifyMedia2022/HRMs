import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sales Portal - HRMS",
  description: "Sales management and CRM tools",
}

export default function SalesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
