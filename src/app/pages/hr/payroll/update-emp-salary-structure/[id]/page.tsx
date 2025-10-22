"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { SidebarConfig } from "@/components/sidebar-config"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DatePicker } from "@/components/ui/date-picker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { IconDeviceFloppy } from "@tabler/icons-react"

interface Employee {
  id: string
  Full_name: string | null
  emp_code: string | null
  job_role: string | null
  CTC: string | null
  Basic_Monthly_Remuneration: string | null
  Basic_Annual_Remuneration: string | null
  HRA_Monthly_Remuneration: string | null
  HRA_Annual_Remuneration: string | null
  OTHER_ALLOWANCE_Monthly_Remuneration: string | null
  OTHER_ALLOWANCE_Annual_Remuneration: string | null
  PF_Monthly_Contribution: string | null
  PF_Annual_Contribution: string | null
  gross_salary: string | null
  netSalary: string | null
}

export default function EmployeeSalaryStructurePage() {
  const params = useParams()
  const employeeId = params.id as string
  
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    salary_pay_mode: '',
    reimbursement_pay_mode: '',
    PF_Number: '',
    UAN: '',
    Employee_PF_Contribution_limit: '',
    Salary_revision_month: '',
    Arrear_with_effect_from: '',
    Paygroup: '',
    esic: 'No',
    CTC: '',
    advanced_salary_date: '',
    Advanced_salary: '',
    months: '0',
    Reimbursement_amount: '',
    Basic_Monthly_Remuneration: '',
    Basic_Annual_Remuneration: '',
    HRA_Monthly_Remuneration: '',
    HRA_Annual_Remuneration: '',
    OTHER_ALLOWANCE_Monthly_Remuneration: '',
    OTHER_ALLOWANCE_Annual_Remuneration: '',
    PF_Monthly_Contribution: '',
    PF_Annual_Contribution: '',
    Employee_Esic_Monthly: '',
    Employee_Esic_Annual: '',
    Employer_Esic_Monthly: '',
    Employer_Esic_Annual: '',
    gross_salary: '',
    netSalary: '',
  })

  useEffect(() => {
    fetchEmployeeData()
  }, [employeeId])

  const fetchEmployeeData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/payroll/Employee-salary-structure/Update-emp-salary-structure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: employeeId }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        setEmployee(data.data)
        // Fields remain empty - not pre-filled
      }
    } catch (error) {
      console.error('Error fetching employee:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    const newFormData = {
      ...formData,
      [field]: value
    }
    setFormData(newFormData)
    
    // Trigger calculation when relevant fields change
    if (['CTC', 'Paygroup', 'Employee_PF_Contribution_limit', 'esic', 'Advanced_salary', 'months', 'advanced_salary_date', 'Reimbursement_amount'].includes(field)) {
      setTimeout(() => calculateSalaryWithData(newFormData), 0)
    }
  }

  // useEffect to trigger calculation when form data changes
  useEffect(() => {
    if (formData.CTC && formData.Paygroup) {
      calculateSalaryWithData(formData)
    }
  }, [formData.CTC, formData.Paygroup, formData.Employee_PF_Contribution_limit, formData.esic, formData.Advanced_salary, formData.months, formData.advanced_salary_date, formData.Reimbursement_amount])

  const calculateSalaryWithData = (data: typeof formData) => {
    const ctc = parseFloat(data.CTC) || 0
    const payGroup = data.Paygroup
    const pfLimit = data.Employee_PF_Contribution_limit.trim()
    const esicOption = data.esic
    const monthlyCtc = ctc / 12

    let basicSalary = 0, hra = 0, employeePf = 0, employerPf = 0
    let employeeEsic = 0, employerEsic = 0
    let otherAllowance = 0, grossSalary = 0, netSalary = 0

    if (payGroup === 'Intern') {
      basicSalary = monthlyCtc
      hra = 0
      employeePf = 0
      employerPf = 0
      otherAllowance = 0
      grossSalary = basicSalary

      if (esicOption === 'Yes' && grossSalary <= 21000) {
        // Solve net = gross - 0.04 * net → net = gross / 1.04
        netSalary = Math.round(grossSalary / 1.04)
        employeeEsic = Math.round(netSalary * 0.0075)
        employerEsic = Math.round(netSalary * 0.0325)
      } else {
        netSalary = grossSalary
      }
    } else {
      if (monthlyCtc >= 22000) {
        basicSalary = Math.round(monthlyCtc * 0.5)
        hra = Math.round(basicSalary * 0.5)
        employeePf = pfLimit ? Math.min(Math.round(basicSalary * 0.12), 1800) : 0
        employerPf = employeePf
        otherAllowance = Math.floor(basicSalary * 0.5 - employeePf)
        grossSalary = basicSalary + hra + otherAllowance
        netSalary = grossSalary - employeePf
      } else {
        basicSalary = Math.round(monthlyCtc * 0.5)
        hra = Math.round(basicSalary * 0.5)
        employeePf = pfLimit ? Math.min(Math.round(basicSalary * 0.12), 1800) : 0
        employerPf = employeePf
        grossSalary = Math.floor((monthlyCtc - employeePf) / 1.0325)

        if (esicOption === 'Yes' && grossSalary <= 21000) {
          employeeEsic = Math.ceil(grossSalary * 0.0075)
          employerEsic = Math.ceil(grossSalary * 0.0325)
        }

        otherAllowance = Math.floor(grossSalary - basicSalary - hra)
        netSalary = grossSalary - employeePf - employeeEsic
      }
    }

    // Advanced Salary Deduction
    const advSalary = parseFloat(data.Advanced_salary) || 0
    const advMonths = parseInt(data.months) || 0
    const advDate = data.advanced_salary_date
    if (advSalary > 0 && advMonths > 0 && advDate) {
      const monthlyDeduction = Math.round(advSalary / advMonths)
      netSalary -= monthlyDeduction
    }

    // Reimbursement
    const reimbursement = parseFloat(data.Reimbursement_amount) || 0
    if (reimbursement > 0) {
      netSalary += reimbursement
    }

    // Update form data
    setFormData(prev => ({
      ...prev,
      Basic_Monthly_Remuneration: Math.round(basicSalary).toString(),
      Basic_Annual_Remuneration: (payGroup === 'Intern' ? ctc : Math.round(basicSalary * 12)).toString(),
      HRA_Monthly_Remuneration: Math.round(hra).toString(),
      HRA_Annual_Remuneration: Math.round(hra * 12).toString(),
      OTHER_ALLOWANCE_Monthly_Remuneration: otherAllowance.toString(),
      OTHER_ALLOWANCE_Annual_Remuneration: (otherAllowance * 12).toString(),
      PF_Monthly_Contribution: employeePf.toString(),
      PF_Annual_Contribution: (employeePf * 12).toString(),
      Employee_Esic_Monthly: employeeEsic.toString(),
      Employee_Esic_Annual: (employeeEsic * 12).toString(),
      Employer_Esic_Monthly: employerEsic.toString(),
      Employer_Esic_Annual: (employerEsic * 12).toString(),
      gross_salary: Math.round(grossSalary).toString(),
      netSalary: Math.round(netSalary).toString(),
    }))
  }


  const handleSave = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/employees/update-salary', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: employeeId,
          ...formData,
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert('Salary structure updated successfully!')
      } else {
        alert('Failed to update: ' + data.error)
      }
    } catch (error) {
      console.error('Error updating salary:', error)
      alert('Failed to update salary structure')
    } finally {
      setSaving(false)
    }
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
                    <Button variant="default" size="sm">Salary Structure</Button>
                  </div>
                  <Button onClick={handleSave} disabled={saving}>
                    <IconDeviceFloppy className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
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

              <center><h2 className="text-2xl font-bold mb-6">Employee Salary Structure</h2></center>

              {/* Payment Details */}
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle>Payment Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <Input
                      placeholder="Enter Salary Payment Mode"
                      value={formData.salary_pay_mode}
                      onChange={(e) => handleInputChange('salary_pay_mode', e.target.value)}
                    />
                    <Input
                      placeholder="Enter Reimbursement Payment Mode"
                      value={formData.reimbursement_pay_mode}
                      onChange={(e) => handleInputChange('reimbursement_pay_mode', e.target.value)}
                    />
                    <Input value="NEW" readOnly className="w-32" />
                  </div>
                </CardContent>
              </Card>

              {/* Provident Fund */}
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle>Provident Fund</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <Input
                        placeholder="Enter PF Number"
                        value={formData.PF_Number}
                        onChange={(e) => handleInputChange('PF_Number', e.target.value)}
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        placeholder="Enter UAN Number"
                        value={formData.UAN}
                        onChange={(e) => handleInputChange('UAN', e.target.value)}
                      />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="pf_limit" className="text-xs">Employee PF Contribution limit</Label>
                      <Input
                        id="pf_limit"
                        placeholder="PF Limit"
                        value={formData.Employee_PF_Contribution_limit}
                        onChange={(e) => handleInputChange('Employee_PF_Contribution_limit', e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* CTC Details */}
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle>CTC Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Label className="text-xs">Salary Revision Month</Label>
                      {(() => {
                        const toYMD = (d?: Date) => d ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` : '';
                        return (
                          <DatePicker
                            id="salary_revision_month"
                            value={formData.Salary_revision_month ? new Date(formData.Salary_revision_month) : undefined}
                            onChange={(d) => handleInputChange('Salary_revision_month', toYMD(d))}
                          />
                        )
                      })()}

                    </div>
                    <div className="flex-1">
                      <Label className="text-xs">Arrear with effect from</Label>
                      {(() => {
                        const toYMD = (d?: Date) => d ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` : '';
                        return (
                          <DatePicker
                            id="arrear_effect_from"
                            value={formData.Arrear_with_effect_from ? new Date(formData.Arrear_with_effect_from) : undefined}
                            onChange={(d) => handleInputChange('Arrear_with_effect_from', toYMD(d))}
                          />
                        )
                      })()}

                    </div>
                    <div className="flex-1">
                      <Label className="text-xs">Pay Group</Label>
                      <Select value={formData.Paygroup} onValueChange={(value) => handleInputChange('Paygroup', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Pay Group" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Intern">Intern</SelectItem>
                          <SelectItem value="FullTime">Full Time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs">ESIC Applicable</Label>
                      <Select value={formData.esic} onValueChange={(value) => handleInputChange('esic', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="No">No</SelectItem>
                          <SelectItem value="Yes">Yes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs">CTC</Label>
                      <Input
                        type="number"
                        id="ctc"
                        value={formData.CTC}
                        onChange={(e) => handleInputChange('CTC', e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Advanced Salary */}
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle>Advanced salary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Label className="text-xs">Advanced Salary Date</Label>
                      {(() => {
                        const toYMD = (d?: Date) => d ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` : '';
                        return (
                          <DatePicker
                            id="advanced_salary_date"
                            value={formData.advanced_salary_date ? new Date(formData.advanced_salary_date) : undefined}
                            onChange={(d) => handleInputChange('advanced_salary_date', toYMD(d))}
                          />
                        )
                      })()}

                    </div>
                    <div className="flex-1">
                      <Label className="text-xs">Advanced Salary Amount</Label>
                      <Input
                        type="number"
                        value={formData.Advanced_salary}
                        onChange={(e) => handleInputChange('Advanced_salary', e.target.value)}
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs">Months</Label>
                      <Select value={formData.months} onValueChange={(value) => handleInputChange('months', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[...Array(13)].map((_, i) => (
                            <SelectItem key={i} value={i.toString()}>{i}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs">Reimbursement Amount</Label>
                      <Input
                        type="number"
                        value={formData.Reimbursement_amount}
                        onChange={(e) => handleInputChange('Reimbursement_amount', e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* (A) Salary Details */}
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle>(A) Salary Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <table className="w-full border-collapse border">
                    <thead>
                      <tr className="bg-muted">
                        <th className="border p-2 text-left">Component</th>
                        <th className="border p-2 text-left">Fixed</th>
                        <th className="border p-2 text-left">Monthly Remuneration</th>
                        <th className="border p-2 text-left">Annual Remuneration</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border p-2">BASIC</td>
                        <td className="border p-2">Fixed</td>
                        <td className="border p-2"><Input type="number" value={formData.Basic_Monthly_Remuneration} readOnly className="border-none bg-transparent" /></td>
                        <td className="border p-2"><Input type="number" value={formData.Basic_Annual_Remuneration} readOnly className="border-none bg-transparent" /></td>
                      </tr>
                      <tr>
                        <td className="border p-2">HRA</td>
                        <td className="border p-2">Fixed</td>
                        <td className="border p-2"><Input type="number" value={formData.HRA_Monthly_Remuneration} readOnly className="border-none bg-transparent" /></td>
                        <td className="border p-2"><Input type="number" value={formData.HRA_Annual_Remuneration} readOnly className="border-none bg-transparent" /></td>
                      </tr>
                      <tr>
                        <td className="border p-2">OTHER ALLOWANCE</td>
                        <td className="border p-2">Fixed</td>
                        <td className="border p-2"><Input type="number" value={formData.OTHER_ALLOWANCE_Monthly_Remuneration} readOnly className="border-none bg-transparent" /></td>
                        <td className="border p-2"><Input type="number" value={formData.OTHER_ALLOWANCE_Annual_Remuneration} readOnly className="border-none bg-transparent" /></td>
                      </tr>
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              {/* (C) Other benefits */}
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle>(C) - Other benefits</CardTitle>
                </CardHeader>
              </Card>

              {/* (D) Contributions / Retrials */}
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle>(D) - Contributions / Retrials</CardTitle>
                </CardHeader>
                <CardContent>
                  <table className="w-full border-collapse border">
                    <thead>
                      <tr className="bg-muted">
                        <th className="border p-2 text-left">Component Name</th>
                        <th className="border p-2 text-left">Monthly Contribution</th>
                        <th className="border p-2 text-left">Annual Contribution</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border p-2">PF</td>
                        <td className="border p-2"><Input type="number" value={formData.PF_Monthly_Contribution} readOnly className="border-none bg-transparent" /></td>
                        <td className="border p-2"><Input type="number" value={formData.PF_Annual_Contribution} readOnly className="border-none bg-transparent" /></td>
                      </tr>
                    </tbody>
                  </table>
                  <div className="mt-4 p-3 bg-orange-50 border-l-4 border-orange-400 text-sm">
                    ⚠ Note: Retrials will not be paid with salary. The contribution will be either made on your respective fund accounts or you will be entitled for them on retirement/separation from organisation.
                  </div>
                </CardContent>
              </Card>

              {/* (E) Recurring Deductions */}
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle>(E) - Recurring Deductions</CardTitle>
                </CardHeader>
                <CardContent>
                  <table className="w-full border-collapse border">
                    <thead>
                      <tr className="bg-muted">
                        <th className="border p-2 text-left">Component Name</th>
                        <th className="border p-2 text-left">Nature of Component</th>
                        <th className="border p-2 text-left">Monthly Remuneration</th>
                        <th className="border p-2 text-left">Annual Remuneration</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border p-2">Employee PF</td>
                        <td className="border p-2">-</td>
                        <td className="border p-2"><Input type="number" value={formData.PF_Monthly_Contribution} readOnly className="border-none bg-transparent" /></td>
                        <td className="border p-2"><Input type="number" value={formData.PF_Annual_Contribution} readOnly className="border-none bg-transparent" /></td>
                      </tr>
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              {/* ESIC Deductions */}
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle>(E) - Esic Deductions</CardTitle>
                </CardHeader>
                <CardContent>
                  <table className="w-full border-collapse border">
                    <thead>
                      <tr className="bg-muted">
                        <th className="border p-2 text-left">Component Name</th>
                        <th className="border p-2 text-left">Nature of Component</th>
                        <th className="border p-2 text-left">Monthly Remuneration</th>
                        <th className="border p-2 text-left">Annual Remuneration</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border p-2">Employee Esic</td>
                        <td className="border p-2">-</td>
                        <td className="border p-2"><Input type="number" value={formData.Employee_Esic_Monthly} readOnly className="border-none bg-transparent" /></td>
                        <td className="border p-2"><Input type="number" value={formData.Employee_Esic_Annual} readOnly className="border-none bg-transparent" /></td>
                      </tr>
                      <tr>
                        <td className="border p-2">Employer Esic</td>
                        <td className="border p-2">-</td>
                        <td className="border p-2"><Input type="number" value={formData.Employer_Esic_Monthly} readOnly className="border-none bg-transparent" /></td>
                        <td className="border p-2"><Input type="number" value={formData.Employer_Esic_Annual} readOnly className="border-none bg-transparent" /></td>
                      </tr>
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              {/* Gross (B) */}
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle>Gross (B)</CardTitle>
                </CardHeader>
                <CardContent>
                  <Input type="number" value={formData.gross_salary} readOnly className="text-lg font-bold" />
                </CardContent>
              </Card>

              {/* Net take home */}
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle>Net take home (Excluding TDS)</CardTitle>
                </CardHeader>
                <CardContent>
                  <Input type="number" value={formData.netSalary} readOnly className="text-lg font-bold" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}