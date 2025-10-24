"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { SidebarConfig } from "@/components/sidebar-config"
import { useToast } from "@/hooks/use-toast"

type TaxEstimation = {
  user_id: string
  Full_name: string
  emp_code: string
  Gross_salary: string
  salary_head: string
  variable_amount: string
  employer_details: string
  Income_from_other: string
  HRA_80GG: string
  HRA_Exempted: string
  A_80C: string
  A_Others: string
  Standard_Deduction: string
  Net_taxable_income: string
  Annual_Projected_TDS: string
  TDS_deducted: string
  Remaining_Tax: string
  TDS_subsequent_month: string
  TDS_this_month: string
  Total_Tax: string
  Gross_salary1: string
  salary_head1: string
  variable_amount1: string
  employer_details1: string
  Income_from_other1: string
  A_Others1: string
  Standard_Deduction1: string
  Net_taxable_income1: string
  Annual_Projected_TDS1: string
  TDS_deducted1: string
  Remaining_Tax1: string
  TDS_subsequent_month1: string
  TDS_this_month1: string
  Total_Tax1: string
}

export default function TaxEstimatorPage() {
  const [taxData, setTaxData] = useState<TaxEstimation[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<TaxEstimation | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchTaxEstimations()
  }, [])

  const fetchTaxEstimations = async () => {
    try {
      const res = await fetch("/api/payroll/tax-estimator")
      const data = await res.json()
      if (data.success) {
        setTaxData(data.data)
      } else {
        toast({ title: "Error", description: "Failed to load tax estimations", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch data", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (employee: TaxEstimation) => {
    setSelectedEmployee(employee)
    setIsModalOpen(true)
  }

  return (
    <>
      <SidebarConfig role="hr" />
      <div className="flex flex-1 flex-col" style={{ background: "#f4f4f4" }}>
        {/* Top Navigation Menu */}
        <nav className="bg-white flex items-center justify-between px-6" style={{ height: "70px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
          <h2 className="text-3xl font-bold" style={{ color: "steelblue", textShadow: "2px 3px 4px rgba(0, 0, 0, 0.5)" }}>
            Tax Estimatation
          </h2>
          <ul className="flex gap-5 list-none m-0 p-0">
            <li className="relative group">
              <Link
                href="/pages/hr"
                className="block px-4 py-2 text-white font-bold rounded-md transition-all"
                style={{ background: "linear-gradient(to bottom, #0b2da5, #00c6ff)" }}
              >
                Dashboard
              </Link>
            </li>
            <li className="relative group">
              <Link
                href="/pages/hr/payroll/tax"
                className="block px-4 py-2 text-white font-bold rounded-md transition-all"
                style={{ background: "linear-gradient(to bottom, #0b2da5, #00c6ff)" }}
              >
                Tax
              </Link>
            </li>
            <li className="relative group">
              <button
                className="px-4 py-2 text-white font-bold rounded-md transition-all cursor-pointer border-none"
                style={{ background: "linear-gradient(to bottom, #0b2da5, #00c6ff)" }}
              >
                Update Tax Estimatation
              </button>
              <ul className="absolute top-full left-0 mt-1 bg-white list-none p-2 m-0 min-w-[180px] rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <li className="p-1">
                  <Link
                    href="/pages/hr/payroll/tax-estimator/update"
                    className="block px-3 py-2 text-[#004d40] font-normal rounded hover:bg-gray-100 transition-colors"
                  >
                    Update Employees Tax Estimatation
                  </Link>
                </li>
              </ul>
            </li>
          </ul>
        </nav>

        {/* Main Content */}
        <div className="p-5">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
                <thead>
                  <tr style={{ background: "linear-gradient(to bottom, #0b2da5, #00c6ff)" }}>
                    <th className="text-center align-middle p-3 text-white font-bold border border-gray-300">ID</th>
                    <th className="text-center align-middle p-3 text-white font-bold border border-gray-300">Name</th>
                    <th className="text-center align-middle p-3 text-white font-bold border border-gray-300">Employee Code</th>
                    <th className="text-center align-middle p-3 text-white font-bold border border-gray-300">View</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="text-center p-4 border border-gray-300 bg-white">
                        Loading...
                      </td>
                    </tr>
                  ) : taxData.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center p-4 border border-gray-300 bg-white">
                        No tax estimation data available
                      </td>
                    </tr>
                  ) : (
                    taxData.map((employee) => (
                      <tr key={employee.user_id} className="hover:bg-gray-50 transition-colors">
                        <td className="text-center align-middle p-3 border border-gray-300 bg-white">
                          {employee.user_id}
                        </td>
                        <td className="text-center align-middle p-3 border border-gray-300 bg-white">
                          {employee.Full_name}
                        </td>
                        <td className="text-center align-middle p-3 border border-gray-300 bg-white">
                          {employee.emp_code}
                        </td>
                        <td className="text-center align-middle p-3 border border-gray-300 bg-white">
                          <button
                            onClick={() => handleViewDetails(employee)}
                            className="text-sm font-bold px-3 py-1.5 border border-blue-600 bg-blue-600 text-white rounded transition-all hover:bg-blue-700"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsModalOpen(false)}
          />
          <div
            className="fixed top-0 right-0 w-full md:w-1/2 h-full bg-white shadow-2xl z-50 overflow-y-auto"
            style={{ borderRadius: "12px 0 0 12px" }}
          >
            {/* Modal Header */}
            <div
              className="flex items-center justify-between p-4 text-black font-bold text-lg border-b"
              style={{ background: "#b9e3f4", borderRadius: "12px 0 0 0" }}
            >
              <h5 className="text-xl">
                <span className="mr-2">📄</span> Tax Details
              </h5>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-2xl border-none bg-transparent cursor-pointer hover:opacity-70"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            {selectedEmployee && (
              <div className="p-5" style={{ background: "#f9f9f9", maxHeight: "calc(100vh - 80px)", overflowY: "auto" }}>
                <table className="w-full">
                  <tbody>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3" style={{ color: "#0b2da5" }}>Name:</th>
                      <td className="py-2 px-3">{selectedEmployee.Full_name}</td>
                    </tr>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3" style={{ color: "#0b2da5" }}>Employee Code:</th>
                      <td className="py-2 px-3">{selectedEmployee.emp_code}</td>
                    </tr>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3" style={{ color: "#0b2da5" }}>Gross Salary:</th>
                      <td className="py-2 px-3">{selectedEmployee.Gross_salary}</td>
                    </tr>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3" style={{ color: "#0b2da5" }}>Salary Head:</th>
                      <td className="py-2 px-3">{selectedEmployee.salary_head}</td>
                    </tr>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3" style={{ color: "#0b2da5" }}>Variable Amount:</th>
                      <td className="py-2 px-3">{selectedEmployee.variable_amount}</td>
                    </tr>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3" style={{ color: "#0b2da5" }}>Employee Details:</th>
                      <td className="py-2 px-3">{selectedEmployee.employer_details}</td>
                    </tr>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3" style={{ color: "#0b2da5" }}>Income From Other:</th>
                      <td className="py-2 px-3">{selectedEmployee.Income_from_other}</td>
                    </tr>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3" style={{ color: "#0b2da5" }}>HRA/80GG:</th>
                      <td className="py-2 px-3">{selectedEmployee.HRA_80GG}</td>
                    </tr>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3" style={{ color: "#0b2da5" }}>HRA Exempted:</th>
                      <td className="py-2 px-3">{selectedEmployee.HRA_Exempted}</td>
                    </tr>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3" style={{ color: "#0b2da5" }}>A 80C:</th>
                      <td className="py-2 px-3">{selectedEmployee.A_80C}</td>
                    </tr>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3" style={{ color: "#0b2da5" }}>A Others:</th>
                      <td className="py-2 px-3">{selectedEmployee.A_Others}</td>
                    </tr>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3" style={{ color: "#0b2da5" }}>Standard Deduction:</th>
                      <td className="py-2 px-3">{selectedEmployee.Standard_Deduction}</td>
                    </tr>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3" style={{ color: "#0b2da5" }}>Net Taxable Income:</th>
                      <td className="py-2 px-3">{selectedEmployee.Net_taxable_income}</td>
                    </tr>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3" style={{ color: "#0b2da5" }}>Annual Projected TDS:</th>
                      <td className="py-2 px-3">{selectedEmployee.Annual_Projected_TDS}</td>
                    </tr>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3" style={{ color: "#0b2da5" }}>TDS Deducted:</th>
                      <td className="py-2 px-3">{selectedEmployee.TDS_deducted}</td>
                    </tr>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3" style={{ color: "#0b2da5" }}>Remaining Tax:</th>
                      <td className="py-2 px-3">{selectedEmployee.Remaining_Tax}</td>
                    </tr>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3" style={{ color: "#0b2da5" }}>TDS Subsequent Month:</th>
                      <td className="py-2 px-3">{selectedEmployee.TDS_subsequent_month}</td>
                    </tr>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3" style={{ color: "#0b2da5" }}>TDS This Month:</th>
                      <td className="py-2 px-3">{selectedEmployee.TDS_this_month}</td>
                    </tr>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3" style={{ color: "#0b2da5" }}>Old Total Tax:</th>
                      <td className="py-2 px-3">{selectedEmployee.Total_Tax}</td>
                    </tr>
                    <tr className="border-b bg-blue-50">
                      <th className="text-left py-2 px-3" style={{ color: "#0b2da5" }}>New Gross Salary:</th>
                      <td className="py-2 px-3">{selectedEmployee.Gross_salary1}</td>
                    </tr>
                    <tr className="border-b bg-blue-50">
                      <th className="text-left py-2 px-3" style={{ color: "#0b2da5" }}>New Salary Head:</th>
                      <td className="py-2 px-3">{selectedEmployee.salary_head1}</td>
                    </tr>
                    <tr className="border-b bg-blue-50">
                      <th className="text-left py-2 px-3" style={{ color: "#0b2da5" }}>New Variable Amount:</th>
                      <td className="py-2 px-3">{selectedEmployee.variable_amount1}</td>
                    </tr>
                    <tr className="border-b bg-blue-50">
                      <th className="text-left py-2 px-3" style={{ color: "#0b2da5" }}>New Employer Details:</th>
                      <td className="py-2 px-3">{selectedEmployee.employer_details1}</td>
                    </tr>
                    <tr className="border-b bg-blue-50">
                      <th className="text-left py-2 px-3" style={{ color: "#0b2da5" }}>New Income From Other:</th>
                      <td className="py-2 px-3">{selectedEmployee.Income_from_other1}</td>
                    </tr>
                    <tr className="border-b bg-blue-50">
                      <th className="text-left py-2 px-3" style={{ color: "#0b2da5" }}>New Chapter VI A - Others(I):</th>
                      <td className="py-2 px-3">{selectedEmployee.A_Others1}</td>
                    </tr>
                    <tr className="border-b bg-blue-50">
                      <th className="text-left py-2 px-3" style={{ color: "#0b2da5" }}>New Standard Deduction(J):</th>
                      <td className="py-2 px-3">{selectedEmployee.Standard_Deduction1}</td>
                    </tr>
                    <tr className="border-b bg-blue-50">
                      <th className="text-left py-2 px-3" style={{ color: "#0b2da5" }}>New Net taxable income(K=B+C+D+E-I-J):</th>
                      <td className="py-2 px-3">{selectedEmployee.Net_taxable_income1}</td>
                    </tr>
                    <tr className="border-b bg-blue-50">
                      <th className="text-left py-2 px-3" style={{ color: "#0b2da5" }}>New Annual Projected TDS(L):</th>
                      <td className="py-2 px-3">{selectedEmployee.Annual_Projected_TDS1}</td>
                    </tr>
                    <tr className="border-b bg-blue-50">
                      <th className="text-left py-2 px-3" style={{ color: "#0b2da5" }}>New TDS deducted till date(M):</th>
                      <td className="py-2 px-3">{selectedEmployee.TDS_deducted1}</td>
                    </tr>
                    <tr className="border-b bg-blue-50">
                      <th className="text-left py-2 px-3" style={{ color: "#0b2da5" }}>New Remaining Tax in subsequent months(N):</th>
                      <td className="py-2 px-3">{selectedEmployee.Remaining_Tax1}</td>
                    </tr>
                    <tr className="border-b bg-blue-50">
                      <th className="text-left py-2 px-3" style={{ color: "#0b2da5" }}>New TDS, in subsequent month(O):</th>
                      <td className="py-2 px-3">{selectedEmployee.TDS_subsequent_month1}</td>
                    </tr>
                    <tr className="border-b bg-blue-50">
                      <th className="text-left py-2 px-3" style={{ color: "#0b2da5" }}>New TDS,this month(P):</th>
                      <td className="py-2 px-3">{selectedEmployee.TDS_this_month1}</td>
                    </tr>
                    <tr className="border-b bg-blue-50">
                      <th className="text-left py-2 px-3" style={{ color: "#0b2da5" }}>Total Tax (New Tax Regime):</th>
                      <td className="py-2 px-3">{selectedEmployee.Total_Tax1}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </>
  )
}
