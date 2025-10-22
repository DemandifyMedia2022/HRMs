"use client"

import { useState, useEffect } from "react"
import { SidebarConfig } from "@/components/sidebar-config"
import { PayrollDetailsModal } from "@/components/payroll-details-modal"
import { Button } from "@/components/ui/button"
import { IconEye, IconRefresh, IconPencil } from "@tabler/icons-react"
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

  return (
    <>
      <SidebarConfig role="hr" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Employee Salary Structure</h1>
                  <p className="text-muted-foreground">
                    View and manage employee salary details and payroll information
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={fetchEmployees}
                  disabled={loading}
                >
                  <IconRefresh className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>All Employees</CardTitle>
                  <CardDescription>
                    {employees.length} employees found
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="text-muted-foreground">Loading employees...</div>
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[80px]">ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Emp Code</TableHead>
                            <TableHead>Company</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead className="text-right w-[150px]">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {employees.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center text-muted-foreground">
                                No employees found
                              </TableCell>
                            </TableRow>
                          ) : (
                            employees.map((employee) => (
                              <TableRow key={employee.id}>
                                <TableCell className="font-medium">
                                  {employee.id}
                                </TableCell>
                                <TableCell>{employee.Full_name || 'N/A'}</TableCell>
                                <TableCell>{employee.emp_code || 'N/A'}</TableCell>
                                <TableCell>{employee.company_name || 'N/A'}</TableCell>
                                <TableCell>{employee.department || 'N/A'}</TableCell>
                                <TableCell className="text-right">
                                  <div className="flex gap-2 justify-end">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleViewClick(employee)}
                                    >
                                      <IconEye className="h-4 w-4 mr-1" />
                                      View
                                    </Button>
                                    <Link href={`update-emp-salary-structure/${employee.id}`}>
                                      <Button
                                        size="sm"
                                        variant="default"
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
          </div>
        </div>
      </div>

      <PayrollDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        employee={selectedEmployee}
      />
    </>
  )
}