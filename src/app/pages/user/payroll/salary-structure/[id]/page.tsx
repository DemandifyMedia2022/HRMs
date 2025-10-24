"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { SidebarConfig } from "@/components/sidebar-config"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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
  const params = useParams()
  const employeeId = params.id as string
  
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEmployeeData()
  }, [employeeId])

  const fetchEmployeeData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/payroll/salary-structure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: employeeId }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        setEmployee(data.data)
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
        <SidebarConfig role="hr" />
        <div className="flex items-center justify-center h-screen">
          <div className="text-muted-foreground">Loading employee data...</div>
        </div>
      </>
    )
  }

  if (!employee) {
    return (
      <>
        <SidebarConfig role="hr" />
        <div className="flex items-center justify-center h-screen">
          <div className="text-muted-foreground">Employee not found</div>
        </div>
      </>
    )
  }

  return (
    <>
      <SidebarConfig role="hr" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6">
              {/* Header */}
              <header className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Link href="/payroll/employee-salary">
                      <Button variant="ghost" size="sm">← Back</Button>
                    </Link>
                    <Link href="/dashboard">
                      <Button variant="ghost" size="sm">Dashboard</Button>
                    </Link>
                    <Button variant="default" size="sm">My Salary Structure</Button>
                  </div>
                </div>
                
                {/* Employee Info Banner */}
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold">{employee.Full_name || 'N/A'}</h2>
                        <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                          <span><strong>Employee ID:</strong> {employee.id}</span>
                          <span><strong>Designation:</strong> {employee.job_role || 'N/A'}</span>
                          <span><strong>Employee Code:</strong> {employee.emp_code || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </header>

              <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
                <center>
                  <h2 className="text-2xl font-bold mb-6">Employee Salary Structure</h2>
                </center>

                {/* Payment Details */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Payment Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <input 
                          type="text" 
                          value={employee.salary_pay_mode || ''} 
                          readOnly 
                          className="w-full p-2 border rounded text-center bg-gray-50"
                          placeholder="Salary Payment Mode"
                        />
                      </div>
                      <div className="flex-1">
                        <input 
                          type="text" 
                          value={employee.reimbursement_pay_mode || ''} 
                          readOnly 
                          className="w-full p-2 border rounded text-center bg-gray-50"
                          placeholder="Reimbursement Payment Mode"
                        />
                      </div>
                      <div className="flex-1">
                        <input 
                          type="text" 
                          value="NEW" 
                          readOnly 
                          className="w-full p-2 border rounded text-center bg-gray-50"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Statutory Details */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Statutory Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <span className="text-sm">Is Employee's Aadhar and PAN Number Linked?</span>
                      <span className="font-bold text-lg">
                        {employee.Is_employees_Aadhar_and_PAN_number_linked || 'N/A'}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Provident Fund */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Provident Fund</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <input 
                          type="text" 
                          value={employee.PF_Number || ''} 
                          readOnly 
                          className="w-full p-2 border rounded text-center bg-gray-50"
                          placeholder="PF Number"
                        />
                      </div>
                      <div className="flex-1">
                        <input 
                          type="text" 
                          value={employee.UAN || ''} 
                          readOnly 
                          className="w-full p-2 border rounded text-center bg-gray-50"
                          placeholder="UAN Number"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs mb-1">Employee PF Contribution limit</label>
                        <input 
                          type="text" 
                          value={employee.Employee_PF_Contribution_limit || ''} 
                          readOnly 
                          className="w-full p-2 border rounded text-center bg-gray-50"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* CTC Details */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>CTC Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-xs mb-1">Salary Revision Month</label>
                        <input 
                          type="text" 
                          value={formatDate(employee.Salary_revision_month)} 
                          readOnly 
                          className="w-full p-2 border rounded text-center bg-gray-50"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs mb-1">Arrear with effect from</label>
                        <input 
                          type="text" 
                          value={formatDate(employee.Arrear_with_effect_from)} 
                          readOnly 
                          className="w-full p-2 border rounded text-center bg-gray-50"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs mb-1">Pay Group</label>
                        <input 
                          type="text" 
                          value={employee.Paygroup || ''} 
                          readOnly 
                          className="w-full p-2 border rounded text-center bg-gray-50"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs mb-1">CTC</label>
                        <input 
                          type="text" 
                          value={employee.CTC || ''} 
                          readOnly 
                          className="w-full p-2 border rounded text-center bg-gray-50"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* (A) Salary Details */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>(A) Salary Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <table className="w-full border-collapse border">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border p-3 text-left">Component</th>
                          <th className="border p-3 text-left">Fixed</th>
                          <th className="border p-3 text-left">Monthly Remuneration</th>
                          <th className="border p-3 text-left">Annual Remuneration</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border p-3">BASIC</td>
                          <td className="border p-3">Fixed</td>
                          <td className="border p-3">
                            <input 
                              type="number" 
                              value={employee.Basic_Monthly_Remuneration || ''} 
                              readOnly 
                              className="w-full text-center border-none bg-transparent outline-none"
                            />
                          </td>
                          <td className="border p-3">
                            <input 
                              type="number" 
                              value={employee.Basic_Annual_Remuneration || ''} 
                              readOnly 
                              className="w-full text-center border-none bg-transparent outline-none"
                            />
                          </td>
                        </tr>
                        <tr>
                          <td className="border p-3">HRA</td>
                          <td className="border p-3">Fixed</td>
                          <td className="border p-3">
                            <input 
                              type="number" 
                              value={employee.HRA_Monthly_Remuneration || ''} 
                              readOnly 
                              className="w-full text-center border-none bg-transparent outline-none"
                            />
                          </td>
                          <td className="border p-3">
                            <input 
                              type="number" 
                              value={employee.HRA_Annual_Remuneration || ''} 
                              readOnly 
                              className="w-full text-center border-none bg-transparent outline-none"
                            />
                          </td>
                        </tr>
                        <tr>
                          <td className="border p-3">OTHER ALLOWANCE</td>
                          <td className="border p-3">Fixed</td>
                          <td className="border p-3">
                            <input 
                              type="number" 
                              value={employee.OTHER_ALLOWANCE_Monthly_Remuneration || ''} 
                              readOnly 
                              className="w-full text-center border-none bg-transparent outline-none"
                            />
                          </td>
                          <td className="border p-3">
                            <input 
                              type="number" 
                              value={employee.OTHER_ALLOWANCE_Annual_Remuneration || ''} 
                              readOnly 
                              className="w-full text-center border-none bg-transparent outline-none"
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </CardContent>
                </Card>

                {/* (C) Other benefits */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>(C) - Other benefits</CardTitle>
                  </CardHeader>
                </Card>

                {/* (D) Contributions / Retrials */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>(D) - Contributions / Retrials</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <table className="w-full border-collapse border">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border p-3 text-left">Component Name</th>
                          <th className="border p-3 text-left">Monthly Contribution</th>
                          <th className="border p-3 text-left">Annual Contribution</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border p-3">PF</td>
                          <td className="border p-3">
                            <input 
                              type="number" 
                              value={employee.PF_Monthly_Contribution || ''} 
                              readOnly 
                              className="w-full text-center border-none bg-transparent outline-none"
                            />
                          </td>
                          <td className="border p-3">
                            <input 
                              type="number" 
                              value={employee.PF_Annual_Contribution || ''} 
                              readOnly 
                              className="w-full text-center border-none bg-transparent outline-none"
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <div className="mt-4 p-3 bg-orange-50 border-l-4 border-orange-400 text-sm">
                      ⚠ Note: Retrials will not be paid with salary. The contribution will be either made on your respective fund accounts or you will be entitled for them on retirement/separation from organisation.
                    </div>
                  </CardContent>
                </Card>

                {/* (E) Recurring Deductions */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>(E) - Recurring Deductions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <table className="w-full border-collapse border">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border p-3 text-left">Component Name</th>
                          <th className="border p-3 text-left">Nature of Component</th>
                          <th className="border p-3 text-left">Monthly Remuneration</th>
                          <th className="border p-3 text-left">Annual Remuneration</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border p-3">Employee PF</td>
                          <td className="border p-3">-</td>
                          <td className="border p-3">{employee.PF_Monthly_Contribution || ''}</td>
                          <td className="border p-3">{employee.PF_Annual_Contribution || ''}</td>
                        </tr>
                      </tbody>
                    </table>
                  </CardContent>
                </Card>

                {/* Gross Salary */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Gross (B)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center text-2xl font-bold p-4 bg-gray-50 rounded">
                      {employee.gross_salary || '0'}
                    </div>
                  </CardContent>
                </Card>

                {/* Net Salary */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Net Salary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center text-2xl font-bold p-4 bg-green-50 rounded text-green-700">
                      {employee.netSalary || '0'}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
