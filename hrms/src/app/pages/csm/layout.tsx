import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "CSM Portal - HRMS",
  description: "Customer Success Management tools and dashboard",
}

export default function CSMLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
