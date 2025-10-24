"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { SidebarConfig } from "@/components/sidebar-config"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { IconSearch, IconX, IconEye, IconFileText, IconCalendar, IconShieldCheck, IconChartBar, IconCalculator, IconSettings } from "@tabler/icons-react"

type TaxRow = {
  // Common list fields (as in Laravel blade)
  user_id?: string | number
  id?: string | number
  Full_name?: string
  emp_code?: string
  // Keep the object open to allow arbitrary API columns
  [key: string]: any
}

export default function Page() {
  const [rows, setRows] = useState<TaxRow[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState("")

  const fetchRows = async (query?: string) => {
    try {
      setLoading(true)
      const url = query && query.length > 0 ? `/api/payroll/tax-structure?search=${encodeURIComponent(query)}` : "/api/payroll/tax-structure"
      const res = await fetch(url, { cache: "no-store" })
      const json = await res.json()
      if (json.success) setRows(json.data as TaxRow[])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRows()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [selected, setSelected] = useState<TaxRow | null>(null)

  return (
    <>
      <SidebarConfig role="hr" />
      <div className="flex flex-1 flex-col gap-6 p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        {/* Enhanced Header */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Tax Structure Management
              </h1>
              <p className="text-muted-foreground text-sm">
                View and manage employee tax details and structures
              </p>
            </div>
            <Button variant="outline" size="sm" asChild className="hover:bg-primary hover:text-primary-foreground transition-colors">
              <Link href="/pages/hr">Dashboard</Link>
            </Button>
          </div>
        </div>

        {/* Quick Nav */}
        <Card className="border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg">Quick Navigation</CardTitle>
            <CardDescription>Access payroll management tools</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              <div className="relative group">
                <Button variant="outline" size="sm" className="w-full justify-start gap-2 hover:bg-primary hover:text-primary-foreground transition-colors">
                  <IconCalendar className="h-4 w-5" />
                  Process Attendance
                  <span className="ml-auto">▼</span>
                </Button>
                <div className="absolute top-full left-0 mt-1 bg-background border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 min-w-[200px]">
                  <Link href="/pages/hr/payroll/tax/process-attendance" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">
                    View Attendance
                  </Link>
                </div>
              </div>
              
              <div className="relative group">
                <Button variant="outline" size="sm" className="w-full justify-start gap-2 hover:bg-primary hover:text-primary-foreground transition-colors">
                  <IconShieldCheck className="h-4 w-4" />
                  Statutory
                  <span className="ml-auto">▼</span>
                </Button>
                <div className="absolute top-full left-0 mt-1 bg-background border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 min-w-[200px]">
                  <Link href="/pages/hr/payroll/statutory" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">
                    View Statutory
                  </Link>
                </div>
              </div>
              
              <div className="relative group">
                <Button variant="outline" size="sm" className="w-full justify-start gap-2 hover:bg-primary hover:text-primary-foreground transition-colors">
                  <IconChartBar className="h-4 w-4" />
                  Tax Slabs
                  <span className="ml-auto">▼</span>
                </Button>
                <div className="absolute top-full left-0 mt-1 bg-background border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 min-w-[200px]">
                  <Link href="/pages/hr/payroll/tax-slabs" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">
                    View Slabs
                  </Link>
                </div>
              </div>
              
              <div className="relative group">
                <Button variant="outline" size="sm" className="w-full justify-start gap-2 hover:bg-primary hover:text-primary-foreground transition-colors">
                  <IconCalculator className="h-4 w-4" />
                  Tax Estimator
                  <span className="ml-auto">▼</span>
                </Button>
                <div className="absolute top-full left-0 mt-1 bg-background border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 min-w-[200px]">
                  <Link href="/pages/hr/payroll/tax-estimator" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">
                    Employees Tax Estimator
                  </Link>
                </div>
              </div>
              
              <div className="relative group">
                <Button variant="outline" size="sm" className="w-full justify-start gap-2 hover:bg-primary hover:text-primary-foreground transition-colors">
                  <IconSettings className="h-4 w-4" />
                  Tax Structure
                  <span className="ml-auto">▼</span>
                </Button>
                <div className="absolute top-full left-0 mt-1 bg-background border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 min-w-[200px]">
                  <Link href="/pages/hr/payroll/tax/update" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">
                    Update Employees Tax Structure
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search & Table */}
        <Card className="border-slate-200 dark:border-slate-700">
          <CardHeader className="border-b border-slate-200 dark:border-slate-700">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-xl">Employee Tax Records</CardTitle>
                <CardDescription className="mt-1">
                  {rows.length} employee{rows.length !== 1 ? 's' : ''} found
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && fetchRows(q)}
                    placeholder="Search by name, code, or ID..."
                    className="pl-9 w-64 bg-white dark:bg-slate-800"
                  />
                </div>
                <Button onClick={() => fetchRows(q)} size="sm" className="bg-gradient-to-r from-primary to-blue-600">
                  <IconSearch className="h-4 w-4 mr-1" />
                  Search
                </Button>
                <Button onClick={() => { setQ(""); fetchRows("") }} variant="outline" size="sm" className="hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors">
                  <IconX className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-12 text-center text-muted-foreground">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                <div>Loading tax structure...</div>
              </div>
            ) : rows.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <IconFileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <div className="font-medium">No records found</div>
                <div className="text-sm">Try adjusting your search criteria</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-slate-50 dark:bg-slate-800/50">
                      <th className="h-12 px-4 text-left align-middle font-semibold text-slate-700 dark:text-slate-300">ID</th>
                      <th className="h-12 px-4 text-left align-middle font-semibold text-slate-700 dark:text-slate-300">Name</th>
                      <th className="h-12 px-4 text-left align-middle font-semibold text-slate-700 dark:text-slate-300">Employee Code</th>
                      <th className="h-12 px-4 text-left align-middle font-semibold text-slate-700 dark:text-slate-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row: TaxRow, idx: number) => (
                      <tr key={`${row.user_id ?? row.id ?? row.emp_code ?? idx}`} className="border-b transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-4 align-middle font-medium text-primary">{String(row.user_id ?? row.id ?? "")}</td>
                        <td className="p-4 align-middle font-medium">{row.Full_name ?? row.name ?? ""}</td>
                        <td className="p-4 align-middle text-muted-foreground">{row.emp_code ?? ""}</td>
                        <td className="p-4 align-middle">
                          <Button
                            onClick={() => setSelected(row)}
                            variant="outline"
                            size="sm"
                            className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
                          >
                            <IconEye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Details Drawer */}
      {selected && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity" onClick={() => setSelected(null)} />
          <div className="fixed top-0 right-0 h-full w-full md:w-1/2 lg:w-2/5 bg-white dark:bg-slate-900 shadow-2xl z-50 overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="sticky top-0 bg-gradient-to-r from-primary to-blue-600 text-white shadow-lg p-6 flex items-center justify-between z-10">
              <div>
                <h2 className="text-2xl font-bold">Tax Details</h2>
                <p className="text-sm text-white/80 mt-1">Employee tax structure information</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelected(null)}
                className="hover:bg-white/20 text-white"
              >
                <IconX className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-6 space-y-3">
              {Object.entries(selected).map(([k, v], idx) => (
                <div 
                  key={k} 
                  className="grid grid-cols-2 gap-4 py-3 border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors rounded px-3"
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  <div className="font-semibold text-sm text-slate-600 dark:text-slate-400 capitalize">
                    {k.replace(/_/g, " ")}
                  </div>
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100 break-words">
                    {String(v ?? "—")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  )
}
