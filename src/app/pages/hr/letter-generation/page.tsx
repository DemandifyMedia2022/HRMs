"use client"

import { SidebarConfig } from "@/components/sidebar-config"
import { IconFileText, IconArrowRight, IconCheck } from "@tabler/icons-react"
import Link from "next/link"

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
  // Compute counts dynamically from the config
  const migratedCount = letterCategories.reduce((acc, cat) => acc + cat.letters.filter(l => l.migrated).length, 0)
  const remainingCount = letterCategories.reduce((acc, cat) => acc + cat.letters.filter(l => !l.migrated && !l.disabled).length, 0)

  return (
    <>
      <SidebarConfig role="hr" />
      <div className="flex flex-1 flex-col gap-4 p-6 bg-slate-50 dark:bg-slate-950 min-h-screen">
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                Letter Generation
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Select a letter type to create and download official employee letters
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-full">
                <IconCheck className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                <span className="text-green-700 dark:text-green-300 font-medium">{migratedCount} Migrated</span>
              </div>
              <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full">
                <span className="text-slate-600 dark:text-slate-400">{remainingCount} Remaining</span>
              </div>
            </div>
          </div>
        </div>

        {/* Letter Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {letterCategories.map((category, index) => (
            <div key={index} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded">
              <div className="border-b border-slate-200 dark:border-slate-800 px-6 py-3 bg-slate-50 dark:bg-slate-800">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{category.name}</h2>
              </div>
              <div className="p-4">
                <ul className="space-y-2">
                  {category.letters.map((letter, letterIndex) => (
                    <li key={letterIndex}>
                      <Link
                        href={letter.disabled ? "#" : letter.url}
                        aria-disabled={letter.disabled ? true : undefined}
                        className={`flex items-center justify-between p-3 rounded transition-colors group ${letter.disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-slate-50 dark:hover:bg-slate-800"}`}
                      >
                        <div className="flex items-center gap-3">
                          <IconFileText className="h-4 w-4 text-slate-400" />
                          <span className="text-sm text-slate-700 dark:text-slate-300">{letter.name}</span>
                          {letter.migrated && (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-xs text-green-700 dark:text-green-300">
                              <IconCheck className="h-3 w-3" />
                              New
                            </span>
                          )}
                        </div>
                        <IconArrowRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600 dark:group-hover:text-slate-400 transition-colors" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Inline preview removed; letters open dedicated form pages */}
      </div>
    </>
  )
}
