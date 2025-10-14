"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"    

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

interface PayrollDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  employee: Employee | null
}

export function PayrollDetailsModal({ isOpen, onClose, employee }: PayrollDetailsModalProps) {
  if (!employee) return null

  const InfoRow = ({ label, value }: { label: string; value: any }) => (
    <div className="grid grid-cols-2 gap-4 py-2 border-b">
      <div className="font-medium text-sm text-muted-foreground">{label}</div>
      <div className="text-sm">{value || 'N/A'}</div>
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Payroll Details</DialogTitle>
          <DialogDescription>
            Complete salary structure and payroll information for {employee.Full_name}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[70vh] pr-4">
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-primary">Basic Information</h3>
              <div className="space-y-1">
                <InfoRow label="Employee Name" value={employee.Full_name} />
                <InfoRow label="Employee Code" value={employee.emp_code} />
                <InfoRow label="Company" value={employee.company_name} />
                <InfoRow label="Department" value={employee.department} />
                <InfoRow label="Job Role" value={employee.job_role} />
                <InfoRow label="Email" value={employee.email} />
                <InfoRow label="Contact" value={employee.contact_no} />
                <InfoRow label="Joining Date" value={employee.joining_date} />
                <InfoRow label="Employment Type" value={employee.employment_type} />
                <InfoRow label="Employment Status" value={employee.employment_status} />
              </div>
            </div>

            {/* Salary Structure */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-primary">Salary Structure</h3>
              <div className="space-y-1">
                <InfoRow label="CTC (Annual)" value={employee.CTC ? `₹${employee.CTC}` : 'N/A'} />
                <InfoRow label="Gross Salary" value={employee.gross_salary ? `₹${employee.gross_salary}` : 'N/A'} />
                <InfoRow label="Net Salary" value={employee.netSalary ? `₹${employee.netSalary}` : 'N/A'} />
                <InfoRow label="Pay Group" value={employee.Paygroup} />
              </div>
            </div>

            {/* Monthly Remuneration */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-primary">Monthly Remuneration</h3>
              <div className="space-y-1">
                <InfoRow 
                  label="Basic Salary (Monthly)" 
                  value={employee.Basic_Monthly_Remuneration ? `₹${employee.Basic_Monthly_Remuneration}` : 'N/A'} 
                />
                <InfoRow 
                  label="HRA (Monthly)" 
                  value={employee.HRA_Monthly_Remuneration ? `₹${employee.HRA_Monthly_Remuneration}` : 'N/A'} 
                />
                <InfoRow 
                  label="Other Allowance (Monthly)" 
                  value={employee.OTHER_ALLOWANCE_Monthly_Remuneration ? `₹${employee.OTHER_ALLOWANCE_Monthly_Remuneration}` : 'N/A'} 
                />
              </div>
            </div>

            {/* Annual Remuneration */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-primary">Annual Remuneration</h3>
              <div className="space-y-1">
                <InfoRow 
                  label="Basic Salary (Annual)" 
                  value={employee.Basic_Annual_Remuneration ? `₹${employee.Basic_Annual_Remuneration}` : 'N/A'} 
                />
                <InfoRow 
                  label="HRA (Annual)" 
                  value={employee.HRA_Annual_Remuneration ? `₹${employee.HRA_Annual_Remuneration}` : 'N/A'} 
                />
                <InfoRow 
                  label="Other Allowance (Annual)" 
                  value={employee.OTHER_ALLOWANCE_Annual_Remuneration ? `₹${employee.OTHER_ALLOWANCE_Annual_Remuneration}` : 'N/A'} 
                />
              </div>
            </div>

            {/* PF Details */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-primary">Provident Fund (PF)</h3>
              <div className="space-y-1">
                <InfoRow label="PF Number" value={employee.PF_Number} />
                <InfoRow label="UAN" value={employee.UAN} />
                <InfoRow label="PF Contribution Limit" value={employee.Employee_PF_Contribution_limit} />
                <InfoRow 
                  label="PF Monthly Contribution" 
                  value={employee.PF_Monthly_Contribution ? `₹${employee.PF_Monthly_Contribution}` : 'N/A'} 
                />
                <InfoRow 
                  label="PF Annual Contribution" 
                  value={employee.PF_Annual_Contribution ? `₹${employee.PF_Annual_Contribution}` : 'N/A'} 
                />
              </div>
            </div>

            {/* ESIC Details */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-primary">ESIC</h3>
              <div className="space-y-1">
                <InfoRow 
                  label="Employee ESIC (Monthly)" 
                  value={employee.Employee_Esic_Monthly ? `₹${employee.Employee_Esic_Monthly}` : 'N/A'} 
                />
                <InfoRow 
                  label="Employee ESIC (Annual)" 
                  value={employee.Employee_Esic_Annual ? `₹${employee.Employee_Esic_Annual}` : 'N/A'} 
                />
                <InfoRow 
                  label="Employer ESIC (Monthly)" 
                  value={employee.Employer_Esic_Monthly ? `₹${employee.Employer_Esic_Monthly}` : 'N/A'} 
                />
                <InfoRow 
                  label="Employer ESIC (Annual)" 
                  value={employee.Employer_Esic_Annual ? `₹${employee.Employer_Esic_Annual}` : 'N/A'} 
                />
              </div>
            </div>

            {/* Bank Details */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-primary">Bank Details</h3>
              <div className="space-y-1">
                <InfoRow label="Bank Name" value={employee.bank_name} />
                <InfoRow label="Branch" value={employee.branch} />
                <InfoRow label="Account Number" value={employee.Account_no} />
                <InfoRow label="IFSC Code" value={employee.IFSC_code} />
                <InfoRow label="Salary Pay Mode" value={employee.salary_pay_mode} />
              </div>
            </div>

            {/* Tax Details */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-primary">Tax Details</h3>
              <div className="space-y-1">
                <InfoRow label="Tax Regime" value={employee.Tax_regime} />
                <InfoRow label="PAN Card Number" value={employee.pan_card_no} />
                <InfoRow label="Aadhaar Card Number" value={employee.adhar_card_no} />
                <InfoRow label="Aadhaar-PAN Linked" value={employee.Is_employees_Aadhar_and_PAN_number_linked} />
              </div>
            </div>

            {/* Additional Information */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-primary">Additional Information</h3>
              <div className="space-y-1">
                <InfoRow 
                  label="Salary Revision Month" 
                  value={employee.Salary_revision_month ? new Date(employee.Salary_revision_month).toLocaleDateString() : 'N/A'} 
                />
                <InfoRow 
                  label="Arrear Effective From" 
                  value={employee.Arrear_with_effect_from ? new Date(employee.Arrear_with_effect_from).toLocaleDateString() : 'N/A'} 
                />
                <InfoRow 
                  label="Advanced Salary" 
                  value={employee.Advanced_salary ? `₹${employee.Advanced_salary}` : 'N/A'} 
                />
                <InfoRow 
                  label="Advanced Salary Date" 
                  value={employee.advanced_salary_date ? new Date(employee.advanced_salary_date).toLocaleDateString() : 'N/A'} 
                />
                <InfoRow 
                  label="Reimbursement Amount" 
                  value={employee.Reimbursement_amount ? `₹${employee.Reimbursement_amount}` : 'N/A'} 
                />
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}