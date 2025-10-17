"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { SidebarConfig } from "@/components/sidebar-config"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Employee {
  id: string
  Full_name: string | null
  emp_code: string | null
  job_role: string | null
  salary_pay_mode: string | null
  reimbursement_pay_mode: string | null
  Is_employees_Aadhar_and_PAN_number_linked: string | null
  PF_Number: string | null
  UAN: string | null
  Employee_PF_Contribution_limit: string | null
  Salary_revision_month: string | null
  Arrear_with_effect_from: string | null
  Paygroup: string | null
  CTC: string | null
  Basic_Monthly_Remuneration: string | null
  Basic_Annual_Remuneration: string | null
  HRA_Monthly_Remuneration: string | null
  HRA_Annual_Remuneration: string | null
  OTHER_ALLOWANCE_Monthly_Remuneration: string | null
  OTHER_ALLOWANCE_Annual_Remuneration: string | null
  PF_Monthly_Contribution: string | null
  PF_Annual_Contribution: string | null
  Employee_Esic_Monthly: string | null
  Employee_Esic_Annual: string | null
  Employer_Esic_Monthly: string | null
  Employer_Esic_Annual: string | null
  gross_salary: string | null
  netSalary: string | null
}

export default function MySalaryStructurePage() {
  const router = useRouter()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEmployeeData()
  }, [])

  const fetchEmployeeData = async () => {
    try {
      setLoading(true)
      // Fetch logged-in user's salary structure
      const response = await fetch('/api/payroll/salary-structure', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const data = await response.json()
      
      if (data.success) {
        setEmployee(data.data)
      } else {
        console.error('Failed to fetch salary structure:', data.error)
        // If not authenticated, redirect to login
        if (response.status === 401) {
          window.location.href = '/login'
        }
      }
    } catch (error) {
      console.error('Error fetching employee:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return (
      <>
        <SidebarConfig role="user" />
        <div className="p-6">
          <div className="max-w-5xl mx-auto">
            <Card>
              <CardContent className="space-y-8">
                <div className="text-center">
                  <div className="text-lg">Loading employee data...</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    )
  }

  if (!employee) {
    return (
      <>
        <SidebarConfig role="user" />
        <div className="p-6">
          <div className="max-w-5xl mx-auto">
            <Card>
              <CardContent className="space-y-8">
                <div className="text-center">
                  <div className="text-lg">Employee not found</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <SidebarConfig role="user" />
      <div className="p-6">
        <div className="max-w-5xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Employee Salary Structure</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">

              {/* Payment Details */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold">Payment Details</h3>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input readOnly value={employee.salary_pay_mode || ''} className="text-center" />
                  <Input readOnly value={employee.reimbursement_pay_mode || ''} className="text-center" />
                  <Input readOnly value="NEW" className="text-center" />
                </div>
              </div>

              {/* Statutory Details */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold">Statutory Details</h3>
                <Separator />
                <div className="flex items-center gap-4 p-4">
                  <span className="text-sm">Is Employee's Aadhar and PAN Number Linked?</span>
                  <span className="text-sm font-semibold">{employee.Is_employees_Aadhar_and_PAN_number_linked || 'N/A'}</span>
                </div>
              </div>

              {/* Provident Fund */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold">Provident Fund</h3>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input readOnly value={employee.PF_Number || ''} placeholder="PF Number" className="text-center" />
                  <Input readOnly value={employee.UAN || ''} placeholder="UAN Number" className="text-center" />
                  <div className="space-y-1">
                    <Label className="text-xs">Employee PF Contribution limit</Label>
                    <Input readOnly value={employee.Employee_PF_Contribution_limit || ''} className="text-center" />
                  </div>
                </div>
              </div>

              {/* CTC Details */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold">CTC Details</h3>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs">Salary Revision Month</Label>
                    <Input readOnly value={formatDate(employee.Salary_revision_month)} className="text-center" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Arrear with effect from</Label>
                    <Input readOnly value={formatDate(employee.Arrear_with_effect_from)} className="text-center" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Pay Group</Label>
                    <Select disabled>
                      <SelectTrigger>
                        <SelectValue placeholder="Paygroup" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="current">{employee.Paygroup || 'Paygroup'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">CTC</Label>
                    <Input readOnly value={employee.CTC || ''} className="text-center" />
                  </div>
                </div>
              </div>

              {/* (A) Salary Details */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold">(A) Salary Details</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Component</TableHead>
                      <TableHead>Fixed</TableHead>
                      <TableHead>Monthly Remuneration</TableHead>
                      <TableHead>Annual Remuneration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>BASIC</TableCell>
                      <TableCell>Fixed</TableCell>
                      <TableCell><Input type="number" readOnly value={employee.Basic_Monthly_Remuneration || ''} className="text-center" /></TableCell>
                      <TableCell><Input type="number" readOnly value={employee.Basic_Annual_Remuneration || ''} className="text-center" /></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>HRA</TableCell>
                      <TableCell>Fixed</TableCell>
                      <TableCell><Input type="number" readOnly value={employee.HRA_Monthly_Remuneration || ''} className="text-center" /></TableCell>
                      <TableCell><Input type="number" readOnly value={employee.HRA_Annual_Remuneration || ''} className="text-center" /></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>OTHER ALLOWANCE</TableCell>
                      <TableCell>Fixed</TableCell>
                      <TableCell><Input type="number" readOnly value={employee.OTHER_ALLOWANCE_Monthly_Remuneration || ''} className="text-center" /></TableCell>
                      <TableCell><Input type="number" readOnly value={employee.OTHER_ALLOWANCE_Annual_Remuneration || ''} className="text-center" /></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* (C) Other benefits */}
              <div className="space-y-2">
                <h3 className="text-base font-semibold">(C) - Other benefits</h3>
                <div className="rounded-md border bg-white p-3"></div>
              </div>

              {/* (D) Contributions / Retrials */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold">(D) - Contributions / Retrials</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Component Name</TableHead>
                      <TableHead>Monthly Contribution</TableHead>
                      <TableHead>Annual Contribution</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>PF</TableCell>
                      <TableCell><Input type="number" readOnly value={employee.PF_Monthly_Contribution || ''} className="text-center" /></TableCell>
                      <TableCell><Input type="number" readOnly value={employee.PF_Annual_Contribution || ''} className="text-center" /></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                <div className="text-sm bg-muted/50 border-l-4 border-primary p-3">
                  ⚠ Note: Retrials will not be paid with salary. The contribution will be either made on your respective fund accounts or you will be entitled for them on retirement/separation from organisation.
                </div>
              </div>

              {/* (E) Recurring Deductions */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold">(E) - Recurring Deductions</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Component Name</TableHead>
                      <TableHead>Nature of Component</TableHead>
                      <TableHead>Monthly Remuneration</TableHead>
                      <TableHead>Annual Remuneration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Employee PF</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>{employee.PF_Monthly_Contribution || ''}</TableCell>
                      <TableCell>{employee.PF_Annual_Contribution || ''}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Gross (B) */}
              <div className="space-y-2">
                <h3 className="text-base font-semibold">Gross (B)</h3>
                <Input readOnly value={employee.gross_salary || ''} className="max-w-xs" />
              </div>

              {/* Net Salary */}
              <div className="space-y-2">
                <h3 className="text-base font-semibold">Net Salary</h3>
                <Input readOnly value={employee.netSalary || ''} className="max-w-xs" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}