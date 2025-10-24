"use client"

import { useState } from "react"
import Link from "next/link"
import { SidebarConfig } from "@/components/sidebar-config"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { IconCheck, IconFileText, IconCoin, IconShieldCheck, IconBriefcase, IconGift, IconCertificate, IconReceipt, IconFileInvoice } from "@tabler/icons-react"

type StatutoryCard = {
  id: string
  title: string
  status: string
  link: string
  isReviewed: boolean
  icon: React.ComponentType<{ className?: string }>
  description: string
}

export default function StatutoryPage() {
  const [financialYear, setFinancialYear] = useState("2024-2025")

  const statutoryItems: StatutoryCard[] = [
    {
      id: "1",
      title: "Tax Settings",
      status: "Reviewed",
      link: "/pages/hr/payroll/statutory/tax-settings",
      isReviewed: true,
      icon: IconFileText,
      description: "Configure tax exemptions, deductions, and TDS settings"
    },
    {
      id: "2",
      title: "Provident Fund",
      status: "Reviewed",
      link: "/pages/hr/payroll/statutory/provident-fund",
      isReviewed: true,
      icon: IconCoin,
      description: "Manage PF contributions, VPF, and admin charges"
    },
    {
      id: "3",
      title: "Employee State Insurance",
      status: "Reviewed",
      link: "/pages/hr/payroll/statutory/state-insurance",
      isReviewed: true,
      icon: IconShieldCheck,
      description: "Configure ESI wage ceiling and contribution settings"
    },
    {
      id: "4",
      title: "Labour Welfare Fund",
      status: "Reviewed",
      link: "/pages/hr/payroll/statutory/labour-welfare",
      isReviewed: true,
      icon: IconBriefcase,
      description: "Set up labour welfare fund applicability"
    },
    {
      id: "5",
      title: "Bonus",
      status: "Reviewed",
      link: "/pages/hr/payroll/statutory/bonus",
      isReviewed: true,
      icon: IconGift,
      description: "Configure bonus payment settings"
    },
    {
      id: "6",
      title: "Gratuity",
      status: "Reviewed",
      link: "/pages/hr/payroll/statutory/gratuity",
      isReviewed: true,
      icon: IconCertificate,
      description: "Manage gratuity applicability and calculation"
    },
    {
      id: "7",
      title: "Professional Tax",
      status: "Reviewed",
      link: "/pages/hr/payroll/statutory/professional-tax",
      isReviewed: true,
      icon: IconReceipt,
      description: "Set professional tax exemptions and calculations"
    },
    {
      id: "8",
      title: "TDS Deductor Information",
      status: "Reviewed",
      link: "/pages/hr/payroll/statutory/tds-deductor",
      isReviewed: true,
      icon: IconFileInvoice,
      description: "Configure TDS deductor and organization details"
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
                Statutory Compliance
              </h1>
              <p className="text-muted-foreground text-sm">
                Configure and manage all statutory settings and compliance requirements
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild className="hover:bg-primary hover:text-primary-foreground transition-colors">
                <Link href="/pages/hr">Dashboard</Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="hover:bg-primary hover:text-primary-foreground transition-colors">
                <Link href="/pages/hr/payroll/tax">Tax</Link>
              </Button>
              <Button variant="default" size="sm" asChild className="bg-gradient-to-r from-primary to-blue-600">
                <Link href="/pages/hr/payroll/statutory">Statutory</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <IconShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Review All Settings Required
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Complete configuration of all statutory modules to enable payroll processing
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

        {/* Enhanced Statutory Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {statutoryItems.map((item, index) => {
            const Icon = item.icon
            return (
              <Card 
                key={item.id} 
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
                        {item.title}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4 relative z-10">
                  <p className="text-xs text-muted-foreground leading-relaxed min-h-[2.5rem]">
                    {item.description}
                  </p>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 text-xs font-medium rounded-full">
                      <IconCheck className="h-3 w-3" />
                      {item.status}
                    </span>
                    <Link 
                      href={item.link}
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
