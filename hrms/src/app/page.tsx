"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  IconUsers,
  IconUserShield,
  IconBuilding,
  IconChartBar,
  IconCash,
  IconHeadset,
  IconSettings,
  IconUser
} from "@tabler/icons-react"

const roles = [
  {
    id: "admin",
    title: "Admin",
    description: "System administration and management",
    icon: IconUserShield,
    color: "bg-red-100 text-red-800",
    path: "/pages/admin"
  },
  {
    id: "hr",
    title: "HR",
    description: "Human resources and employee management",
    icon: IconUsers,
    color: "bg-blue-100 text-blue-800",
    path: "/pages/hr"
  },
  {
    id: "csm",
    title: "CSM",
    description: "Customer success management",
    icon: IconHeadset,
    color: "bg-green-100 text-green-800",
    path: "/pages/csm"
  },
  {
    id: "it",
    title: "IT",
    description: "Information technology and systems",
    icon: IconSettings,
    color: "bg-purple-100 text-purple-800",
    path: "/pages/it"
  },
  {
    id: "quality",
    title: "Quality",
    description: "Quality assurance and testing",
    icon: IconChartBar,
    color: "bg-orange-100 text-orange-800",
    path: "/pages/quality"
  },
  {
    id: "users",
    title: "User",
    description: "General user access",
    icon: IconUser,
    color: "bg-gray-100 text-gray-800",
    path: "/pages/user"
  },
  {
    id: "marketing",
    title: "Marketing",
    description: "Marketing campaigns and analytics",
    icon: IconBuilding,
    color: "bg-pink-100 text-pink-800",
    path: "/pages/marketing"
  },
  {
    id: "sales",
    title: "Sales",
    description: "Sales management and leads",
    icon: IconCash,
    color: "bg-yellow-100 text-yellow-800",
    path: "/pages/sales"
  }
]

export default function HomePage() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const router = useRouter()

  const handleRoleSelect = (role: typeof roles[0]) => {
    setSelectedRole(role.id)
    router.push(role.path)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome to HRMS
          </h1>
          <p className="text-xl text-gray-600">
            Please select your role to access your dashboard
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {roles.map((role) => {
            const IconComponent = role.icon
            return (
              <Card
                key={role.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 ${
                  selectedRole === role.id ? 'ring-2 ring-blue-500 shadow-lg' : ''
                }`}
                onClick={() => handleRoleSelect(role)}
              >
                <CardHeader className="text-center pb-3">
                  <div className="mx-auto mb-3 p-3 rounded-full bg-slate-100 w-fit">
                    <IconComponent className="h-8 w-8 text-slate-600" />
                  </div>
                  <CardTitle className="text-lg">{role.title}</CardTitle>
                  <Badge variant="secondary" className={role.color}>
                    {role.id.toUpperCase()}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-sm">
                    {role.description}
                  </CardDescription>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Select your role above to continue to your personalized dashboard
          </p>
        </div>
      </div>
    </div>
  )
}
