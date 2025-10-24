"use client"

import { useState, useEffect, useMemo } from "react"
import { SidebarConfig } from "@/components/sidebar-config"
import { PayrollDetailsModal } from "@/components/payroll-details-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { IconEye, IconRefresh, IconPencil, IconSearch, IconUsers } from "@tabler/icons-react"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Employee {
  id: string
  Full_name: string | null
  emp_code: string | null
  company_name: string | null
  department: string | null
  email: string | null
  contact_no: string | null
  job_role: string | null
  joining_date: string | null
  employment_type: string | null
  employment_status: string | null
  CTC: string | null
  Basic_Monthly_Remuneration: string | null
  Basic_Annual_Remuneration: string | null
  HRA_Monthly_Remuneration: string | null
  HRA_Annual_Remuneration: string | null
  OTHER_ALLOWANCE_Monthly_Remuneration: string | null
  OTHER_ALLOWANCE_Annual_Remuneration: string | null
  PF_Monthly_Contribution: string | null
  PF_Annual_Contribution: string | null
  Employee_Esic_Monthly: number | null
  Employee_Esic_Annual: number | null
  Employer_Esic_Monthly: number | null
  Employer_Esic_Annual: number | null
  gross_salary: string | null
  netSalary: string | null
  Paygroup: string | null
  bank_name: string | null
  IFSC_code: string | null
  Account_no: string | null
  branch: string | null
  salary_pay_mode: string | null
  PF_Number: string | null
  UAN: string | null
  Employee_PF_Contribution_limit: string | null
  Tax_regime: string | null
  pan_card_no: string | null
  adhar_card_no: string | null
  Is_employees_Aadhar_and_PAN_number_linked: string | null
  Salary_revision_month: Date | null
  Arrear_with_effect_from: Date | null
  Advanced_salary: number | null
  advanced_salary_date: Date | null
  Reimbursement_amount: number | null
}

export default function EmployeeSalaryPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/payroll/Employee-salary-structure/EmpDetails', {
        method: 'GET',
        
        headers: {
          'Content-Type': 'application/json',
        },
      })
      const data = await response.json()
      
      if (data.success) {
        setEmployees(data.data)
      } else {
        console.error('Failed to fetch employees:', data.error)
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEmployees()
  }, [])

  const handleViewClick = (employee: Employee) => {
    setSelectedEmployee(employee)
    setIsModalOpen(true)
  }

  // Filter employees based on search query
  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) return employees
    
    const query = searchQuery.toLowerCase()
    return employees.filter((employee) => {
      return (
        employee.Full_name?.toLowerCase().includes(query) ||
        employee.emp_code?.toLowerCase().includes(query) ||
        employee.company_name?.toLowerCase().includes(query) ||
        employee.department?.toLowerCase().includes(query) ||
        employee.email?.toLowerCase().includes(query)
      )
    })
  }, [employees, searchQuery])

  return (
    <>
      <SidebarConfig role="hr" />
      <div className="flex flex-1 flex-col gap-6 p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        {/* Enhanced Header */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Employee Salary Structure
              </h1>
              <p className="text-muted-foreground text-sm">
                View and manage employee salary details and payroll information
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchEmployees}
              disabled={loading}
              className="hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <IconRefresh className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Banner */}
        <div className="bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <IconUsers className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-green-900 dark:text-green-100">
                Total Employees: {employees.length}
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                {searchQuery ? `Showing ${filteredEmployees.length} matching results` : 'All employee salary structures'}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <Card className="border-slate-200 dark:border-slate-700">
          <CardHeader className="border-b border-slate-200 dark:border-slate-700">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-xl">Employee Records</CardTitle>
                <CardDescription className="mt-1">
                  {filteredEmployees.length} employee{filteredEmployees.length !== 1 ? 's' : ''} {searchQuery ? 'found' : 'total'}
                </CardDescription>
              </div>
              {/* Search Bar */}
              <div className="relative w-full md:w-80">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, code, company, department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-white dark:bg-slate-800"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-muted-foreground">Loading employees...</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                      <TableHead className="w-[80px] font-semibold">ID</TableHead>
                      <TableHead className="font-semibold">Name</TableHead>
                      <TableHead className="font-semibold">Emp Code</TableHead>
                      <TableHead className="font-semibold">Company</TableHead>
                      <TableHead className="font-semibold">Department</TableHead>
                      <TableHead className="text-right font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground h-32">
                          {searchQuery ? 'No employees found matching your search' : 'No employees found'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredEmployees.map((employee) => (
                        <TableRow key={employee.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <TableCell className="font-medium text-primary">
                            {employee.id}
                          </TableCell>
                          <TableCell className="font-medium">{employee.Full_name || 'N/A'}</TableCell>
                          <TableCell>{employee.emp_code || 'N/A'}</TableCell>
                          <TableCell>{employee.company_name || 'N/A'}</TableCell>
                          <TableCell>{employee.department || 'N/A'}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewClick(employee)}
                                className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
                              >
                                <IconEye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              <Link href={`update-emp-salary-structure/${employee.id}`}>
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
                                >
                                  <IconPencil className="h-4 w-4 mr-1" />
                                  Update
                                </Button>
                              </Link>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <PayrollDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        employee={selectedEmployee}
      />
    </>
  )
}