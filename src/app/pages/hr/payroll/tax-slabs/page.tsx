"use client"

import { useState } from "react"
import Link from "next/link"
import { SidebarConfig } from "@/components/sidebar-config"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { IconCheck, IconBriefcase, IconGift, IconReceipt, IconFileText, IconChartBar } from "@tabler/icons-react"

type SlabCard = {
  id: string
  title: string
  status: string
  link: string
  isCreated: boolean
  icon: React.ComponentType<{ className?: string }>
  description: string
}

export default function TaxSlabsPage() {
  const [financialYear, setFinancialYear] = useState("2024-2025")

  const slabs: SlabCard[] = [
    {
      id: "1",
      title: "Labour Welfare Fund",
      status: "Created",
      link: "/pages/hr/payroll/tax-slabs/labour-welfare-details",
      isCreated: true,
      icon: IconBriefcase,
      description: "Configure labour welfare fund slabs and rates"
    },
    {
      id: "2",
      title: "Bonus (Minimum Wages)",
      status: "Created",
      link: "/pages/hr/payroll/bonus",
      isCreated: true,
      icon: IconGift,
      description: "Set up minimum wage slabs for bonus calculations"
    },
    {
      id: "3",
      title: "Professional Tax",
      status: "Created",
      link: "/pages/hr/payroll/tax-slabs/professional-tax",
      isCreated: true,
      icon: IconReceipt,
      description: "Define professional tax slabs and brackets"
    },
    {
      id: "4",
      title: "Income Tax",
      status: "Created",
      link: "/pages/hr/payroll/tax-slabs/slabs-details",
      isCreated: true,
      icon: IconFileText,
      description: "Manage income tax slabs and rate structures"
    },
  ]

  return (
    <>
      <SidebarConfig role="hr" />
      <div className="flex flex-1 flex-col gap-6 p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        {/* Enhanced Header with Background */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Tax Structure & Slabs
              </h1>
              <p className="text-muted-foreground text-sm">
                Configure and manage tax slabs, rates, and bracket structures
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild className="hover:bg-primary hover:text-primary-foreground transition-colors">
                <Link href="/pages/hr">Dashboard</Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="hover:bg-primary hover:text-primary-foreground transition-colors">
                <Link href="/pages/hr/payroll/tax">Tax</Link>
              </Button>
              <div className="relative group">
                <Button variant="default" size="sm" className="bg-gradient-to-r from-primary to-blue-600">
                  Tax Structure
                  <span className="ml-1">▼</span>
                </Button>
                <div className="absolute top-full right-0 mt-1 bg-background border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 min-w-[220px]">
                  <Link href="/pages/hr/payroll/tax/update" className="block px-4 py-2.5 text-sm hover:bg-muted transition-colors">
                    Update Employees Tax Structure
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg">
                <IconChartBar className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                  Tax Slab Configuration
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Review and configure all tax slabs to ensure accurate salary calculations
                </p>
              </div>
            </div>
            
            <div className="space-y-2 min-w-[220px]">
              <Label htmlFor="financialYear" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Financial Year
              </Label>
              <Select value={financialYear} onValueChange={setFinancialYear}>
                <SelectTrigger id="financialYear" className="bg-white dark:bg-slate-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024-2025">2024 - 2025</SelectItem>
                  <SelectItem value="2023-2024">2023 - 2024</SelectItem>
                  <SelectItem value="2022-2023">2022 - 2023</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Enhanced Slabs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {slabs.map((slab, index) => {
            const Icon = slab.icon
            return (
              <Card 
                key={slab.id} 
                className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Background Gradient on Hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <CardHeader className="pb-3 relative z-10">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-primary/10 dark:bg-primary/20 rounded-lg group-hover:bg-primary/20 dark:group-hover:bg-primary/30 transition-colors">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                        {slab.title}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4 relative z-10">
                  <p className="text-xs text-muted-foreground leading-relaxed min-h-[2.5rem]">
                    {slab.description}
                  </p>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 text-xs font-medium rounded-full">
                      <IconCheck className="h-3 w-3" />
                      {slab.status}
                    </span>
                    <Link 
                      href={slab.link}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary/80 transition-colors group-hover:gap-2"
                    >
                      Configure
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </>
  )
}
