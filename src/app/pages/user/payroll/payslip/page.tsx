"use client"

import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { useState, useEffect } from "react"
import { SidebarConfig } from "@/components/sidebar-config"
import html2pdf from "html2pdf.js"

interface EmployeeDetails {
  Full_name: string | null
  emp_code: string | null
  gender: string | null
  job_role: string | null
  joining_date: string | null
  pan_card_no: string | null
  Account_no: string | null
  UAN: string | null
  bank_name: string | null
  IFSC_code: string | null}

interface SalaryDetails {
  Basic_Monthly_Remuneration: number
  HRA_Monthly_Remuneration: number
  OTHER_ALLOWANCE_Monthly_Remuneration: number
  gross_salary: number
  netSalary: number
}

interface AttendanceData {
  totalDays: number
  presentDays: number
  absentDays: number
  halfDays: number
  payDays: number
}

interface EarningsData {
  basicEarned: number
  hraEarned: number
  otherEarned: number
  totalEarning: number
}

interface DeductionsData {
  pfContribution: number
  professionalTax: number
  incomeTax: number
  esiEarned: number
  totalDeduction: number
}

interface NetPayData {
  inhandSalary: number
  netPayInWords: string
}

interface Payslip {
  year: number
  month: number
}

interface PayslipData {
  employee: EmployeeDetails
  salaryDetails: SalaryDetails
  attendance: AttendanceData
  earnings: EarningsData
  deductions: DeductionsData
  netPay: NetPayData
  payslips: Payslip[]
  selectedMonth: number
  selectedYear: number
}

export default function PayslipPage() {
  const [payslipData, setPayslipData] = useState<PayslipData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list')
  const [detailMonth, setDetailMonth] = useState<number | null>(null)
  const [detailYear, setDetailYear] = useState<number | null>(null)

  useEffect(() => {
    fetchPayslipData()
  }, [])

  const fetchPayslipData = async (month?: number, year?: number) => {
    try {
      setLoading(true)
      let url = '/api/payroll/payslip'
      if (month && year) {
        url += `?month=${month}&year=${year}`
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const data = await response.json()
      
      if (data.success) {
        setPayslipData(data.data)
        setSelectedMonth(data.data.selectedMonth)
        setSelectedYear(data.data.selectedYear)
      } else {
        console.error('Failed to fetch payslip data:', data.error)
        if (response.status === 401) {
          window.location.href = '/login'
        }
      }
    } catch (error) {
      console.error('Error fetching payslip:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewPayslip = async (month: number, year: number) => {
    await fetchPayslipData(month, year)
    setDetailMonth(month)
    setDetailYear(year)
    setViewMode('detail')
  }

  const handleDownloadPayslip = async (month: number, year: number) => {
    try {
      // Fetch the payslip data for the selected month
      const response = await fetch(`/api/payroll/payslip?month=${month}&year=${year}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const data = await response.json()
      
      if (data.success && data.data.employee) {
        const employee = data.data.employee
        const payDays = data.data.attendance.payDays
        const totalEarning = data.data.earnings.totalEarning
        const pfContribution = data.data.deductions.pfContribution
        const netSalary = data.data.netPay.inhandSalary
        const netPayInWords = data.data.netPay.netPayInWords
        
        // Generate PDF
        generatePayslipPDF(employee, month, year, payDays, totalEarning, pfContribution, netSalary, netPayInWords, data.data)
      }
    } catch (error) {
      console.error('Error downloading payslip:', error)
      alert('Failed to download payslip. Please try again.')
    }
  }

  const generatePayslipPDF = async (
    employee: EmployeeDetails,
    month: number,
    year: number,
    payDays: number,
    totalEarning: number,
    pfContribution: number,
    netSalary: number,
    netPayInWords: string,
    fullData: PayslipData
  ) => {
    const monthName = getMonthName(month)
    
    // Create a completely isolated container that doesn't inherit global CSS
    const container = document.createElement('div')
    container.style.cssText = `
      position: fixed !important;
      left: -9999px !important;
      top: 0 !important;
      width: 800px !important;
      background: #ffffff !important;
      z-index: -1 !important;
      isolation: isolate !important;
    `
    container.className = '' // Remove any class that might apply Tailwind styles
    
    // Create inner element with reset styles
    const element = document.createElement('div')
    element.style.cssText = `
      all: initial;
      display: block;
      width: 750px;
      font-family: Arial, sans-serif;
      background-color: #ffffff;
      padding: 25px;
      color: #000000;
      line-height: 1.5;
      box-sizing: border-box;
    `
    element.className = '' // Remove any class that might apply Tailwind styles
    
    element.innerHTML = `
      <div style="all: initial; display: block; max-width: 750px; background: #ffffff; padding: 20px 24px 20px 24px; font-family: Arial, sans-serif; color: #111111; line-height: 1.5; box-sizing: border-box; position: relative; overflow: hidden; min-height: 1000px; padding-bottom: 64px; page-break-inside: avoid;">
        <!-- Top Brand Bars -->
        <div style="position:absolute; top:0; left:0; right:0; height:6px; background:#B144F8; z-index:2;"></div>
        <div style="position:absolute; top:6px; left:24px; width:120px; height:6px; background:#B144F8; z-index:2;"></div>
        <!-- Watermark -->
        
        <!-- Header -->
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: 16px; position: relative; z-index: 3;">
          <div style="display:flex; align-items:center; gap:12px;">
            <div>
              <div style="font-size:18px; font-weight:700; letter-spacing:0.2px; color:#B144F8;">Demandify Media</div>
              <div style="font-size:12px; color:#6b7280;">415, Nyati Empress, Viman Nagar Rd, Clover Park, Viman Nagar, Pune, Maharashtra-123456</div>
            </div>
          </div>
          <div style="text-align:right; position: relative; z-index: 3;">
            <div style="font-size:12px; color:#6b7280;">Payslip</div>
            <div style="font-size:14px; font-weight:600;">${monthName} ${year}</div>
          </div>
        </div>

        <div style="height:1px; background:#e5e7eb; margin: 8px 0 16px; position: relative; z-index: 2;"></div>

        <!-- Employee & Pay Summary -->
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; margin-bottom:16px; position: relative; z-index: 2;">
          <table style="width:100%; border-collapse:collapse; font-size:12px;">
            <tbody>
              <tr><td style="padding:6px 8px; border:1px solid #e5e7eb; width:40%; background:#f9fafb;">Employee</td><td style="padding:6px 8px; border:1px solid #e5e7eb;">${employee.Full_name || 'N/A'}</td></tr>
              <tr><td style="padding:6px 8px; border:1px solid #e5e7eb; background:#f9fafb;">Employee Code</td><td style="padding:6px 8px; border:1px solid #e5e7eb;">${employee.emp_code || 'N/A'}</td></tr>
              <tr><td style="padding:6px 8px; border:1px solid #e5e7eb; background:#f9fafb;">Designation</td><td style="padding:6px 8px; border:1px solid #e5e7eb;">${employee.job_role || 'N/A'}</td></tr>
              <tr><td style="padding:6px 8px; border:1px solid #e5e7eb; background:#f9fafb;">Joining Date</td><td style="padding:6px 8px; border:1px solid #e5e7eb;">${employee.joining_date || 'N/A'}</td></tr>
            </tbody>
          </table>
          <table style="width:100%; border-collapse:collapse; font-size:12px;">
            <tbody>
              <tr><td style="padding:6px 8px; border:1px solid #e5e7eb; width:40%; background:#f9fafb;">PAN</td><td style="padding:6px 8px; border:1px solid #e5e7eb;">${employee.pan_card_no || 'N/A'}</td></tr>
              <tr><td style="padding:6px 8px; border:1px solid #e5e7eb; background:#f9fafb;">Bank</td><td style="padding:6px 8px; border:1px solid #e5e7eb;">${employee.bank_name || 'N/A'} (${employee.Account_no || 'N/A'})</td></tr>
              <tr><td style="padding:6px 8px; border:1px solid #e5e7eb; background:#f9fafb;">UAN</td><td style="padding:6px 8px; border:1px solid #e5e7eb;">${employee.UAN || 'N/A'}</td></tr>
              <tr><td style="padding:6px 8px; border:1px solid #e5e7eb; background:#f9fafb;">Tax Regime</td><td style="padding:6px 8px; border:1px solid #e5e7eb;">NEW</td></tr>
            </tbody>
          </table>
        </div>

        <!-- Earnings vs Deductions -->
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; margin-top:8px; position: relative; z-index: 2;">
          <div>
            <div style="font-size:13px; font-weight:600; margin-bottom:6px;">Earnings (INR)</div>
            <table style="width:100%; border-collapse:collapse; font-size:12px;">
              <thead>
                <tr style="background:#f9fafb;">
                  <th style="text-align:left; padding:8px; border:1px solid #e5e7eb;">Component</th>
                  <th style="text-align:right; padding:8px; border:1px solid #e5e7eb;">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="padding:8px; border:1px solid #e5e7eb;">Basic</td>
                  <td style="padding:8px; border:1px solid #e5e7eb; text-align:right;">${totalEarning.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding:8px; border:1px solid #e5e7eb; font-weight:600;">Total Earnings</td>
                  <td style="padding:8px; border:1px solid #e5e7eb; text-align:right; font-weight:600;">${totalEarning.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <div style="font-size:13px; font-weight:600; margin-bottom:6px;">Deductions (INR)</div>
            <table style="width:100%; border-collapse:collapse; font-size:12px;">
              <thead>
                <tr style="background:#f9fafb;">
                  <th style="text-align:left; padding:8px; border:1px solid #e5e7eb;">Component</th>
                  <th style="text-align:right; padding:8px; border:1px solid #e5e7eb;">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="padding:8px; border:1px solid #e5e7eb;">PF Contribution</td>
                  <td style="padding:8px; border:1px solid #e5e7eb; text-align:right;">${pfContribution.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding:8px; border:1px solid #e5e7eb; font-weight:600;">Total Deductions</td>
                  <td style="padding:8px; border:1px solid #e5e7eb; text-align:right; font-weight:600;">${pfContribution.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Net Pay Summary -->
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; margin-top:16px; align-items:start; position: relative; z-index: 2;">
          <div style="border:1px solid #e5e7eb; border-radius:6px; padding:12px;">
            <div style="font-size:13px; font-weight:600; margin-bottom:6px;">Net Pay (INR)</div>
            <div style="display:flex; justify-content:space-between; font-size:14px;">
              <span>Net Pay</span>
              <span style="font-weight:700;">${netSalary.toFixed(2)}</span>
            </div>
            <div style="margin-top:6px; font-size:12px; color:#6b7280;">In words: ${netPayInWords} only</div>
          </div>
          <div style="font-size:11px; color:#6b7280; align-self:stretch; display:flex; flex-direction:column; justify-content:flex-end; gap:24px;">
            <div style="height:1px; background:#e5e7eb;"></div>
            <div style="display:flex; justify-content:space-between; gap:16px;">
              <div style="text-align:center; flex:1;">
                <div style="height:40px;"></div>
                <div style="height:1px; background:#e5e7eb; margin-top:8px;"></div>
                <div>Authorised Signatory</div>
              </div>
              <div style="text-align:center; flex:1;">
                <div style="height:40px;"></div>
                <div style="height:1px; background:#e5e7eb; margin-top:8px;"></div>
                <div>Employee Signature</div>
              </div>
            </div>
          </div>
        </div>

        <div style="text-align:center; margin-top:12px; margin-bottom:8px; font-size:10px; color:#6b7280; position: relative; z-index: 2;">This is a system-generated payslip and does not require a signature.</div>

        <!-- Footer Contact & Bottom Bar -->
        <div style="position:absolute; left:24px; right:24px; bottom:8px; display:flex; align-items:center; justify-content:center; font-size:8.5px; color:#6b7280; gap:6px; z-index:3; flex-wrap: wrap; line-height: 1.25;">
          <span>Demandify Media, Tower A- 415, Nyati Empress, Viman Nagar Rd, Clover Park, Viman Nagar, Pune, Maharashtra 411014</span>
          <span>•</span>
          <span>www.demandifymedia.com</span>
          <span>•</span>
          <span>support@demandifymedia.com</span>
          <span>•</span>
          <span>+91 7821971890</span>
        </div>
        <div style="position:absolute; left:0; right:0; bottom:0; height:3px; background:#B144F8; z-index:2;"></div>
        <div style="position:absolute; left:24px; bottom:3px; width:90px; height:3px; background:#B144F8; z-index:2;"></div>
      </div>
    `
    
    container.appendChild(element)
    document.body.appendChild(container)
    
    // PDF options with enhanced configuration
    const opt = {
      margin: 8,
      filename: `Payslip_${employee.emp_code}_${monthName}_${year}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.95 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 750,
        windowHeight: 1122,
        scrollY: 0,
        scrollX: 0,
        allowTaint: true,
        foreignObjectRendering: false,
        ignoreElements: (element: any) => {
          return element.tagName === 'STYLE' || element.tagName === 'LINK'
        },
        onclone: (clonedDoc: Document) => {
          const links = clonedDoc.querySelectorAll('link[rel="stylesheet"]')
          links.forEach(link => link.remove())
          const styles = clonedDoc.querySelectorAll('style')
          styles.forEach(style => {
            if (style.textContent && (style.textContent.includes('lab(') || style.textContent.includes('lch(') || style.textContent.includes('oklch('))) {
              style.remove()
            }
          })
        }
      },
      pagebreak: { mode: ['avoid-all'] as any },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
    }
    
    // Small delay to ensure DOM is ready
    setTimeout(() => {
      // Generate and download PDF
      html2pdf().set(opt).from(element).save().then(() => {
        console.log('PDF generated successfully')
        if (container.parentNode) {
          document.body.removeChild(container)
        }
      }).catch((error: any) => {
        console.error('PDF generation error details:', error)
        console.error('Error message:', error.message)
        if (error.stack) console.error('Error stack:', error.stack)
        if (container.parentNode) {
          document.body.removeChild(container)
        }
        alert(`Failed to generate PDF: ${error.message || 'Unknown error'}. Check console for details.`)
      })
    }, 150)
  }

  const handleBackToList = () => {
    setViewMode('list')
  }

  const getMonthName = (month: number) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December']
    return months[month - 1]
  }

  const numberToWords = (num: number): string => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']

    if (num === 0) return 'Zero'

    const convertLessThanThousand = (n: number): string => {
      if (n === 0) return ''
      if (n < 10) return ones[n]
      if (n < 20) return teens[n - 10]
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '')
      return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanThousand(n % 100) : '')
    }

    if (num < 1000) return convertLessThanThousand(num)
    if (num < 100000) {
      return convertLessThanThousand(Math.floor(num / 1000)) + ' Thousand' + 
             (num % 1000 !== 0 ? ' ' + convertLessThanThousand(num % 1000) : '')
    }
    if (num < 10000000) {
      return convertLessThanThousand(Math.floor(num / 100000)) + ' Lakh' + 
             (num % 100000 !== 0 ? ' ' + numberToWords(num % 100000) : '')
    }
    return 'Number too large'
  }

  if (loading) {
    return (
      <>
        <SidebarConfig role="hr" />
        <div className="flex-1 p-4 md:p-6">
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">Loading payslip data...</CardContent>
          </Card>
        </div>
      </>
    )
  }

  if (!payslipData || !payslipData.employee || !payslipData.salaryDetails) {
    return (
      <>
        <SidebarConfig role="hr" />
        <div className="flex-1 p-4 md:p-6">
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">No payslip data available</CardContent>
          </Card>
        </div>
      </>
    )
  }

  // Calculate values for detail view
  const payDays = payslipData.attendance.payDays
  const basicSalary = payslipData.salaryDetails.Basic_Monthly_Remuneration
  const pfContribution = payslipData.deductions.pfContribution
  const totalEarning = payslipData.earnings.totalEarning
  const netSalary = payslipData.netPay.inhandSalary
  const netPayInWords = payslipData.netPay.netPayInWords

  return (
    <>
      <SidebarConfig role="user" />
      <div className="flex-1 p-4 md:gap-6 md:p-6">
        {viewMode === "list" ? (
          <Card>
            <CardHeader>
              <CardTitle>Available Payslips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border bg-muted/20 p-3 text-center text-sm text-muted-foreground mb-4">
                <span className="font-medium text-foreground">Employee:</span>{" "}
                {payslipData.employee?.Full_name}
                <span className="mx-2">|</span>
                <span className="font-medium text-foreground">
                  Employee Code:
                </span>{" "}
                {payslipData.employee?.emp_code}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-primary text-primary-foreground">
                      <th className="p-3 text-center font-medium">
                        Employee ID
                      </th>
                      <th className="p-3 text-center font-medium">Month</th>
                      <th className="p-3 text-center font-medium">Year</th>
                      <th className="p-3 text-center font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payslipData.payslips.length > 0 ? (
                      payslipData.payslips.map((payslip) => (
                        <tr
                          key={`${payslip.year}-${payslip.month}`}
                          className="border-b hover:bg-muted/50"
                        >
                          <td className="p-3 text-center">
                            {payslipData.employee?.emp_code}
                          </td>
                          <td className="p-3 text-center">
                            {getMonthName(payslip.month)}
                          </td>
                          <td className="p-3 text-center">{payslip.year}</td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleViewPayslip(payslip.month, payslip.year)
                                }
                              >
                                View
                              </Button>
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleDownloadPayslip(
                                    payslip.month,
                                    payslip.year
                                  )
                                }
                              >
                                Download
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={4}
                          className="p-6 text-center text-muted-foreground"
                        >
                          No payslips available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>
                Payslip for {getMonthName(detailMonth!)} {detailYear}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex justify-between">
                <Button variant="outline" onClick={handleBackToList}>
                  Back
                </Button>
                <Button
                  onClick={() => handleDownloadPayslip(detailMonth!, detailYear!)}
                >
                  Download PDF
                </Button>
              </div>
              <div className="rounded-md border p-4 bg-white text-sm">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p>
                      <strong>Employee:</strong> {payslipData.employee.Full_name}
                    </p>
                    <p>
                      <strong>Emp Code:</strong> {payslipData.employee.emp_code}
                    </p>
                    <p>
                      <strong>Designation:</strong>{" "}
                      {payslipData.employee.job_role}
                    </p>
                  </div>
                  <div>
                    <p>
                      <strong>Net Salary:</strong> ₹{netSalary.toFixed(2)}
                    </p>
                    <p>
                      <strong>Net Pay in Words:</strong> {netPayInWords}
                    </p>
                    <p>
                      <strong>Pay Days:</strong> {payDays}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}