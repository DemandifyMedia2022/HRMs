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
  IFSC_code: string | null
}

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
      <div style="all: initial; display: block; max-width: 750px; background: #ffffff; padding: 25px; font-family: Arial, sans-serif; color: #000000; line-height: 1.5; box-sizing: border-box;">
        <!-- Company Header -->
        <div style="text-align: center; margin-bottom: 25px; margin-top: 40px;">
          <p style="font-size: 13px; color: #808080; margin: 10px 0;">
            415, Nyati Empress, Viman Nagar Rd, Clover Park, Viman Nagar, Pune, Maharashtra-123456
          </p>
          <h3 style="background: #000000; color: #ffffff; padding: 12px; border-radius: 5px; margin: 15px 0;">
            PAYSLIP FOR ${monthName.toUpperCase()} ${year}
          </h3>
        </div>

        <!-- Employee Details -->
        <div style="margin-bottom: 20px;">
          <h3 style="background: #000000; color: #ffffff; padding: 10px; text-align: center; border-radius: 5px; font-size: 16px;">
            Employee Details
          </h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px;">
            <tbody>
              <tr><td style="border: 1px solid #ddd; padding: 8px; text-align: center;"><b>Name:</b></td><td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${employee.Full_name || 'N/A'}</td></tr>
              <tr><td style="border: 1px solid #ddd; padding: 8px; text-align: center;"><b>Employee Code:</b></td><td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${employee.emp_code || 'N/A'}</td></tr>
              <tr><td style="border: 1px solid #ddd; padding: 8px; text-align: center;"><b>Sex:</b></td><td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${employee.gender || 'N/A'}</td></tr>
              <tr><td style="border: 1px solid #ddd; padding: 8px; text-align: center;"><b>Designation:</b></td><td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${employee.job_role || 'N/A'}</td></tr>
              <tr><td style="border: 1px solid #ddd; padding: 8px; text-align: center;"><b>Location:</b></td><td style="border: 1px solid #ddd; padding: 8px; text-align: center;">Pune</td></tr>
              <tr><td style="border: 1px solid #ddd; padding: 8px; text-align: center;"><b>Joining Date:</b></td><td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${employee.joining_date || 'N/A'}</td></tr>
              <tr><td style="border: 1px solid #ddd; padding: 8px; text-align: center;"><b>PAN:</b></td><td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${employee.pan_card_no || 'N/A'}</td></tr>
              <tr><td style="border: 1px solid #ddd; padding: 8px; text-align: center;"><b>Account Number:</b></td><td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${employee.Account_no || 'N/A'}</td></tr>
              <tr><td style="border: 1px solid #ddd; padding: 8px; text-align: center;"><b>Tax Regime:</b></td><td style="border: 1px solid #ddd; padding: 8px; text-align: center;">NEW</td></tr>
            </tbody>
          </table>
        </div>

        <!-- Pay & Attendance -->
        <div style="margin-bottom: 20px;">
          <h3 style="background: #000000; color: #ffffff; padding: 10px; text-align: center; border-radius: 5px; font-size: 16px;">
            Pay & Attendance
          </h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px;">
            <thead>
              <tr style="background: #f4f4f4;">
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Pay Days</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Attendance Arrear Days</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Increment Arrear Days</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${payDays}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">0.00</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">0.00</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Earnings -->
        <div style="margin-bottom: 20px;">
          <h3 style="background: #000000; color: #ffffff; padding: 10px; text-align: center; border-radius: 5px; font-size: 16px;">
            Earnings (INR)
          </h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px;">
            <thead>
              <tr style="background: #f4f4f4;">
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Component</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Rate</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Gross</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">PF</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Monthly</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Arrear</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">Basic</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${netSalary.toFixed(2)}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${totalEarning.toFixed(2)}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${pfContribution.toFixed(2)}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${netSalary.toFixed(2)}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">0.00</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${netSalary.toFixed(2)}</td>
              </tr>
              <tr style="background: #000000; color: #ffffff; font-weight: bold;">
                <td style="border: 1px solid #000; padding: 8px; text-align: center;">Total Earnings</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: center;">${netSalary.toFixed(2)}</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: center;">${totalEarning.toFixed(2)}</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: center;">${pfContribution.toFixed(2)}</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: center;">${netSalary.toFixed(2)}</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: center;">0.00</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: center;">${netSalary.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Deductions -->
        <div style="margin-bottom: 20px;">
          <h3 style="background: #000000; color: #ffffff; padding: 10px; text-align: center; border-radius: 5px; font-size: 16px;">
            Deductions (INR)
          </h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px;">
            <thead>
              <tr style="background: #f4f4f4;">
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Component</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">Total Deductions</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">0.00</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Net Pay -->
        <div style="margin-bottom: 20px;">
          <h3 style="background: #000000; color: #ffffff; padding: 10px; text-align: center; border-radius: 5px; font-size: 16px;">
            Net Pay (INR)
          </h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px;">
            <tbody>
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;"><b>Net Pay:</b></td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${netSalary.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;"><b>Net Pay in Words:</b></td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${netPayInWords} Only</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Footer Note -->
        <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #808080;">
          Note: This is a system-generated payslip and does not require any signature.
        </div>
      </div>
    `
    
    container.appendChild(element)
    document.body.appendChild(container)
    
    // PDF options with enhanced configuration
    const opt = {
      margin: 10,
      filename: `Payslip_${employee.emp_code}_${monthName}_${year}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.95 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 750,
        windowHeight: 1200,
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
        <div style={{ display: 'flex' }}>
          <div style={{ width: '95%', fontFamily: 'Arial, sans-serif', backgroundColor: '#f5f5f5', margin: 0, padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
              <div style={{ color: '#666' }}>Loading payslip data...</div>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (!payslipData || !payslipData.employee || !payslipData.salaryDetails) {
    return (
      <>
        <SidebarConfig role="hr" />
        <div style={{ display: 'flex' }}>
          <div style={{ width: '95%', fontFamily: 'Arial, sans-serif', backgroundColor: '#f5f5f5', margin: 0, padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
              <div style={{ color: '#666' }}>No payslip data available</div>
            </div>
          </div>
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
      <SidebarConfig role="hr" />
      <div style={{ display: 'flex', width: '100%' }}>
        <div style={{ width: '95%' }}>
          <div style={{
            fontFamily: 'Arial, sans-serif',
            backgroundColor: '#f5f5f5',
            margin: 0,
            padding: '20px'
          }}>
            {viewMode === 'list' ? (
              /* LIST VIEW */
              <div style={{
                maxWidth: '1100px',
                background: 'white',
                padding: '30px',
                borderRadius: '10px',
                boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
                margin: 'auto',
                marginLeft: '9%',
                marginTop: '3%'
              }}>
                <div style={{ marginBottom: '30px' }}>
                  <h3 style={{ 
                    textAlign: 'center', 
                    color: '#0b2da5', 
                    marginBottom: '10px',
                    fontSize: '24px'
                  }}>
                    Available Payslips
                  </h3>
                  <div style={{
                    textAlign: 'center',
                    padding: '15px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '5px',
                    marginTop: '20px'
                  }}>
                    <p style={{ margin: '5px 0', color: '#555' }}>
                      <strong>Employee:</strong> {payslipData.employee?.Full_name} | 
                      <strong> Employee Code:</strong> {payslipData.employee?.emp_code}
                    </p>
                  </div>
                </div>

                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '14px'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: '#0b2da5', color: 'white' }}>
                      <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>Employee ID</th>
                      <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>Month</th>
                      <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>Year</th>
                      <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payslipData.payslips.length > 0 ? (
                      payslipData.payslips.map((payslip, index) => (
                        <tr key={`${payslip.year}-${payslip.month}`} style={{ 
                          backgroundColor: index % 2 === 0 ? 'white' : '#f4f4f4' 
                        }}>
                          <td style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>
                            {payslipData.employee?.emp_code}
                          </td>
                          <td style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>
                            {getMonthName(payslip.month)}
                          </td>
                          <td style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>
                            {payslip.year}
                          </td>
                          <td style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>
                            <button
                              onClick={() => handleViewPayslip(payslip.month, payslip.year)}
                              style={{
                                background: '#0b2da5',
                                color: 'white',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                marginRight: '10px',
                                fontSize: '13px'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.background = '#083080'}
                              onMouseOut={(e) => e.currentTarget.style.background = '#0b2da5'}
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleDownloadPayslip(payslip.month, payslip.year)}
                              style={{
                                background: '#28a745',
                                color: 'white',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                fontSize: '13px'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.background = '#218838'}
                              onMouseOut={(e) => e.currentTarget.style.background = '#28a745'}
                            >
                              Download
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} style={{ 
                          border: '1px solid #ddd', 
                          padding: '30px', 
                          textAlign: 'center', 
                          color: '#999' 
                        }}>
                          No payslips available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              /* DETAIL VIEW */
              <div style={{
                maxWidth: '750px',
                background: 'white',
                padding: '25px',
                borderRadius: '10px',
                boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
                margin: 'auto',
                marginLeft: '9%',
                marginTop: '3%',
                position: 'relative'
              }}>
                {/* Back Button */}
                <button
                  onClick={handleBackToList}
                  style={{
                    position: 'absolute',
                    top: '20px',
                    left: '20px',
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  ← Back to List
                </button>

                {/* Company Header */}
                <div style={{ textAlign: 'center', marginBottom: '25px', marginTop: '40px' }}>
                  <p style={{ fontSize: '13px', color: 'gray', margin: '10px 0' }}>
                    415, Nyati Empress, Viman Nagar Rd, Clover Park, Viman Nagar, Pune, Maharashtra-123456
                  </p>
                  <h3 style={{
                    background: 'black',
                    color: 'white',
                    padding: '12px',
                    borderRadius: '5px',
                    margin: '15px 0'
                  }}>
                    PAYSLIP FOR {getMonthName(detailMonth!).toUpperCase()} {detailYear}
                  </h3>
                </div>

                {/* Employee Details */}
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{
                    background: 'black',
                    color: 'white',
                    padding: '10px',
                    textAlign: 'center',
                    borderRadius: '5px',
                    fontSize: '16px'
                  }}>
                    Employee Details
                  </h3>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    marginTop: '10px',
                    fontSize: '13px'
                  }}>
                    <tbody>
                      <tr><td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}><b>Name:</b></td><td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>{payslipData.employee.Full_name}</td></tr>
                      <tr><td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}><b>Employee Code:</b></td><td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>{payslipData.employee.emp_code}</td></tr>
                      <tr><td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}><b>Sex:</b></td><td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>{payslipData.employee.gender || 'N/A'}</td></tr>
                      <tr><td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}><b>Designation:</b></td><td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>{payslipData.employee.job_role}</td></tr>
                      <tr><td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}><b>Location:</b></td><td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Pune</td></tr>
                      <tr><td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}><b>Joining Date:</b></td><td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>{payslipData.employee.joining_date}</td></tr>
                      <tr><td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}><b>PAN:</b></td><td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>{payslipData.employee.pan_card_no || 'N/A'}</td></tr>
                      <tr><td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}><b>Account Number:</b></td><td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>{payslipData.employee.Account_no || 'N/A'}</td></tr>
                      <tr><td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}><b>Tax Regime:</b></td><td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>NEW</td></tr>
                    </tbody>
                  </table>
                </div>

                {/* Pay & Attendance */}
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{
                    background: 'black',
                    color: 'white',
                    padding: '10px',
                    textAlign: 'center',
                    borderRadius: '5px',
                    fontSize: '16px'
                  }}>
                    Pay & Attendance
                  </h3>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    marginTop: '10px',
                    fontSize: '13px'
                  }}>
                    <thead>
                      <tr style={{ background: '#f4f4f4' }}>
                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Pay Days</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Attendance Arrear Days</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Increment Arrear Days</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>{payDays}</td>
                        <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>0.00</td>
                        <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>0.00</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Earnings */}
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{
                    background: 'black',
                    color: 'white',
                    padding: '10px',
                    textAlign: 'center',
                    borderRadius: '5px',
                    fontSize: '16px'
                  }}>
                    Earnings (INR)
                  </h3>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    marginTop: '10px',
                    fontSize: '12px'
                  }}>
                    <thead>
                      <tr style={{ background: '#f4f4f4' }}>
                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Component</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Rate</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Gross</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>PF</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Monthly</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Arrear</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Basic</td>
                        <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>{netSalary.toFixed(2)}</td>
                        <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>{totalEarning.toFixed(2)}</td>
                        <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>{pfContribution.toFixed(2)}</td>
                        <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>{netSalary.toFixed(2)}</td>
                        <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>0.00</td>
                        <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>{netSalary.toFixed(2)}</td>
                      </tr>
                      <tr style={{ background: 'black', color: 'white', fontWeight: 'bold' }}>
                        <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>Total Earnings</td>
                        <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{netSalary.toFixed(2)}</td>
                        <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{totalEarning.toFixed(2)}</td>
                        <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{pfContribution.toFixed(2)}</td>
                        <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{netSalary.toFixed(2)}</td>
                        <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>0.00</td>
                        <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{netSalary.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Deductions */}
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{
                    background: 'black',
                    color: 'white',
                    padding: '10px',
                    textAlign: 'center',
                    borderRadius: '5px',
                    fontSize: '16px'
                  }}>
                    Deductions (INR)
                  </h3>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    marginTop: '10px',
                    fontSize: '13px'
                  }}>
                    <thead>
                      <tr style={{ background: '#f4f4f4' }}>
                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Component</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Total Deductions</td>
                        <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>0.00</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Net Pay */}
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{
                    background: 'black',
                    color: 'white',
                    padding: '10px',
                    textAlign: 'center',
                    borderRadius: '5px',
                    fontSize: '16px'
                  }}>
                    Net Pay (INR)
                  </h3>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    marginTop: '10px',
                    fontSize: '13px'
                  }}>
                    <tbody>
                      <tr>
                        <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}><b>Net Pay:</b></td>
                        <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>{netSalary.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}><b>Net Pay in Words:</b></td>
                        <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>{netPayInWords} Only</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Footer Note */}
                <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: 'gray' }}>
                  Note: This is a system-generated payslip and does not require any signature.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

