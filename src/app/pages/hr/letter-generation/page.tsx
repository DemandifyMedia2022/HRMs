"use client"

import { SidebarConfig } from "@/components/sidebar-config"
import { IconFileText, IconArrowRight, IconSearch, IconChevronDown, IconChevronRight } from "@tabler/icons-react"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useRouter, useSearchParams } from "next/navigation"

const letterCategories = [
  {
    name: "Initial Stage Letters",
    letters: [
      { name: "Interview Call Letter", url: "/pages/hr/letter-generation/interview-call-letter", migrated: true },
      { name: "Appointment Letter", url: "/pages/hr/letter-generation/appointment-letter", migrated: true },
      { name: "Offer Letter", url: "/pages/hr/letter-generation/offer-letter", migrated: true },
      { name: "Sales Offer Letter", url: "#", migrated: false, disabled: true },
      { name: "Hari Offer Letter", url: "#", migrated: false, disabled: true },
      { name: "Joining Letter", url: "/pages/hr/letter-generation/joining-letter", migrated: true },
      { name: "Reference Letter", url: "/pages/hr/letter-generation/reference-letter", migrated: true }
    ]
  },
  {
    name: "Active Employment Letters",
    letters: [
      { name: "Leave Approval Letter", url: "/pages/hr/letter-generation/leave-approval-letter", migrated: true },
      { name: "Performance Letter", url: "/pages/hr/letter-generation/performance-letter", migrated: true },
      { name: "Promotion Letter", url: "/pages/hr/letter-generation/promotion-letter", migrated: true },
      { name: "Salary Increment Letter", url: "/pages/hr/letter-generation/salary-increment-letter", migrated: true }
    ]
  },
  {
    name: "End of Employment Letters",
    letters: [
      { name: "Resignation Letter", url: "/pages/hr/letter-generation/resignation-letter", migrated: true },
      { name: "Separation Letter", url: "/pages/hr/letter-generation/separation-letter", migrated: true },
      { name: "Transfer Letter", url: "/pages/hr/letter-generation/transfer-letter", migrated: true },
      { name: "Warning Letter", url: "/pages/hr/letter-generation/warning-letter", migrated: true }
    ]
  },
  {
    name: "Post-Employment Letters",
    letters: [
      { name: "Experience Letter", url: "/pages/hr/letter-generation/experience-letter", migrated: true },
      { name: "Relieving Letter", url: "/pages/hr/letter-generation/relieving-letter", migrated: true }
    ]
  }
]

export default function LetterGenerationPage() {
  const migratedCount = useMemo(() => letterCategories.reduce((acc, cat) => acc + cat.letters.filter(l => l.migrated).length, 0), [])
  const totalCount = useMemo(() => letterCategories.reduce((acc, cat) => acc + cat.letters.length, 0), [])
  const router = useRouter()
  const params = useSearchParams()
  const initialQ = params.get('q') || ""
  const initialFilter = (params.get('group') || 'all') as 'all' | 'initial' | 'active' | 'end' | 'post'
  const [query, setQuery] = useState(initialQ)
  const [group, setGroup] = useState<'all' | 'initial' | 'active' | 'end' | 'post'>(initialFilter)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') return {}
    try {
      const raw = localStorage.getItem('hr_letters_collapsed')
      return raw ? JSON.parse(raw) : {}
    } catch { return {} }
  })

  useEffect(() => {
    const usp = new URLSearchParams()
    if (query) usp.set('q', query)
    if (group !== 'all') usp.set('group', group)
    router.replace(`/pages/hr/letter-generation${usp.toString() ? `?${usp.toString()}` : ''}`)
  }, [query, group, router])

  useEffect(() => {
    try { localStorage.setItem('hr_letters_collapsed', JSON.stringify(collapsed)) } catch {}
  }, [collapsed])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const subset = letterCategories.filter(cat => {
      if (group === 'all') return true
      if (group === 'initial') return cat.name.toLowerCase().includes('initial')
      if (group === 'active') return cat.name.toLowerCase().includes('active')
      if (group === 'end') return cat.name.toLowerCase().includes('end of employment')
      if (group === 'post') return cat.name.toLowerCase().includes('post-employment')
      return true
    })
    if (!q) return subset
    return subset.map(cat => ({
      ...cat,
      letters: cat.letters.filter(l => l.name.toLowerCase().includes(q))
    }))
  }, [query, group])

  return (
    <>
      <SidebarConfig role="hr" />
      <div className="flex flex-1 flex-col gap-4 p-6 bg-slate-50 dark:bg-slate-950 min-h-screen">
        <div className="flex items-center justify-between">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/pages/hr">HR</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Letter Generation</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl sm:text-2xl">Letter Generation</CardTitle>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Select a letter type to create and download official employee letters</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">{migratedCount} Migrated</Badge>
              <Badge className="text-xs" variant="outline">{totalCount} Total</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <div className="relative w-full sm:max-w-sm">
                <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search letters" className="pl-8" />
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant={group==='all'?'default':'outline'} onClick={()=>setGroup('all')}>All</Button>
                <Button size="sm" variant={group==='initial'?'default':'outline'} onClick={()=>setGroup('initial')}>Initial</Button>
                <Button size="sm" variant={group==='active'?'default':'outline'} onClick={()=>setGroup('active')}>Active</Button>
                <Button size="sm" variant={group==='end'?'default':'outline'} onClick={()=>setGroup('end')}>End</Button>
                <Button size="sm" variant={group==='post'?'default':'outline'} onClick={()=>setGroup('post')}>Post</Button>
              </div>
              <div className="ml-auto flex gap-2">
                <Button asChild variant="secondary">
                  <Link href="/pages/hr/letter-generation/appointment-letter">Quick: Appointment</Link>
                </Button>
                <Button asChild>
                  <Link href="/pages/hr/letter-generation/offer-letter">Quick: Offer</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((category, index) => (
            <Card key={index} className="overflow-hidden">
              <CardHeader className="py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label={collapsed[category.name] ? 'Expand' : 'Collapse'}
                    onClick={() => setCollapsed(prev => ({...prev, [category.name]: !prev[category.name]}))}
                    className="h-6 w-6 grid place-items-center rounded border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    {collapsed[category.name] ? <IconChevronRight className="h-4 w-4"/> : <IconChevronDown className="h-4 w-4"/>}
                  </button>
                  <CardTitle className="text-sm">{category.name}</CardTitle>
                </div>
                <Badge variant="outline" className="text-[10px]">{category.letters.length}</Badge>
              </CardHeader>
              <CardContent className="p-0">
                {!collapsed[category.name] && (
                <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                  {category.letters.length === 0 && (
                    <li className="px-4 py-6 text-sm text-slate-500">No matches</li>
                  )}
                  {category.letters.map((letter, letterIndex) => (
                    <li key={letterIndex}>
                      <TooltipProvider>
                        <Tooltip delayDuration={200}>
                          <TooltipTrigger asChild>
                            <Link
                              href={letter.disabled ? "#" : letter.url}
                              aria-disabled={letter.disabled ? true : undefined}
                              className={`flex items-center justify-between px-4 py-3 transition-colors group outline-none focus-visible:ring-2 focus-visible:ring-slate-300 dark:focus-visible:ring-slate-700 rounded ${letter.disabled ? "opacity-60 cursor-not-allowed" : "hover:bg-slate-50 dark:hover:bg-slate-900"}`}
                              tabIndex={0}
                              onKeyDown={(e)=>{ if((e.key==='Enter'|| e.key===' ') && !letter.disabled){ (e.currentTarget as HTMLAnchorElement).click(); e.preventDefault(); }}}
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-md bg-slate-100 dark:bg-slate-800 grid place-items-center text-slate-500">
                                  <IconFileText className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{letter.name}</span>
                                  {letter.disabled && (
                                    <span className="text-[11px] text-slate-500">Coming soon</span>
                                  )}
                                </div>
                              </div>
                              <div className="h-7 w-7 rounded-md border border-slate-200 dark:border-slate-800 grid place-items-center text-slate-300 group-hover:text-slate-600 dark:group-hover:text-slate-400">
                                <IconArrowRight className="h-4 w-4" />
                              </div>
                            </Link>
                          </TooltipTrigger>
                          {letter.disabled && (
                            <TooltipContent side="top" className="text-xs">This template is not available yet</TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </li>
                  ))}
                </ul>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  )
}