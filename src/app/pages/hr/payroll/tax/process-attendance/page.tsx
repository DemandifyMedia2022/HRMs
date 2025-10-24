"use client"

import { useState, useEffect } from 'react'
import { SidebarConfig } from '@/components/sidebar-config'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Search, Download, Eye, Edit, ChevronLeft, ChevronRight } from 'lucide-react'

interface ProcessAttendanceData {
  id: number
  Full_name: string
  emp_code: string
  company_name: string
  job_role: string
  pay_days: number
  net_pay: number
  arrear_days: number
}

export default function ProcessAttendancePage() {
  const [data, setData] = useState<ProcessAttendanceData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [month, setMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10,
  })

  const fetchData = async (page = 1) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        month,
        ...(search && { search }),
      })

      const response = await fetch(`/api/payroll/process-attendance?${params}`)
      const result = await response.json()

      if (result.success) {
        setData(result.data)
        setPagination(result.pagination)
      } else {
        console.error('Failed to fetch data:', result.error)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData(pagination.currentPage)
  }, [])

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault()
    fetchData(1)
  }

  const handleDownloadCSV = () => {
    const params = new URLSearchParams({
      month,
      ...(search && { search }),
      download: 'csv',
    })
    window.location.href = `/api/payroll/process-attendance?${params}`
  }

  return (
    <>
      <SidebarConfig role="hr" />
      <div className="flex min-h-screen bg-gray-50">
        <div className="flex-1 p-6 ml-auto" style={{ width: '95%' }}>
          {/* Header Card */}
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-2xl font-bold text-primary">Process Attendance</CardTitle>
              <Button asChild variant="default">
                <Link href="/pages/hr/payroll/tax">← Back to Dashboard</Link>
              </Button>
            </CardHeader>
          </Card>

          {/* Filters Card */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <form onSubmit={handleFilter}>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label htmlFor="month" className="block text-sm font-medium mb-2">
                      Select Month
                    </label>
                    <Input
                      type="month"
                      id="month"
                      value={month}
                      onChange={(e) => setMonth(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label htmlFor="search" className="block text-sm font-medium mb-2">
                      Search Employee
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        id="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Name or Code..."
                        className="pl-10 w-full"
                      />
                    </div>
                  </div>

                  <div className="flex items-end">
                    <Button type="submit" className="w-full">
                      <Search className="mr-2 h-4 w-4" />
                      Filter
                    </Button>
                  </div>

                  <div className="flex items-end">
                    <Button
                      type="button"
                      onClick={handleDownloadCSV}
                      variant="outline"
                      className="w-full bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download CSV
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Table Card */}
          <Card>
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading attendance data...</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full">
                      <thead className="bg-primary text-primary-foreground">
                        <tr>
                          <th className="px-4 py-3 text-center text-sm font-semibold">#</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold">Name</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold">Emp Code</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold">Company</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold">Designation</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold">Paid Days</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold">Net Salary</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold">Arrears</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {data.length > 0 ? (
                          data.map((item, index) => (
                            <tr
                              key={item.id}
                              className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                            >
                              <td className="px-4 py-3 text-center text-sm">
                                {(pagination.currentPage - 1) * pagination.limit + index + 1}
                              </td>
                              <td className="px-4 py-3 text-center text-sm font-medium">
                                {item.Full_name}
                              </td>
                              <td className="px-4 py-3 text-center text-sm">
                                {item.emp_code}
                              </td>
                              <td className="px-4 py-3 text-center text-sm">
                                {item.company_name}
                              </td>
                              <td className="px-4 py-3 text-center text-sm">
                                {item.job_role}
                              </td>
                              <td className="px-4 py-3 text-center text-sm font-semibold text-blue-600">
                                {item.pay_days}
                              </td>
                              <td className="px-4 py-3 text-center text-sm font-semibold text-green-600">
                                ₹{item.net_pay.toLocaleString('en-IN')}
                              </td>
                              <td className="px-4 py-3 text-center text-sm">
                                {item.arrear_days}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className="flex gap-2 justify-center">
                                  <Button
                                    asChild
                                    size="sm"
                                    variant="outline"
                                    className="h-8 w-8 p-0 hover:bg-blue-50"
                                    title="View Annual Report"
                                  >
                                    <Link href={`/pages/hr/payroll/salary-report/${item.emp_code}`}>
                                      <Eye className="h-4 w-4" />
                                    </Link>
                                  </Button>
                                  <Button
                                    asChild
                                    size="sm"
                                    variant="outline"
                                    className="h-8 w-8 p-0"
                                    title="Edit Attendance"
                                  >
                                    <Link href={`/pages/hr/payroll/tax/edit-attendance/${item.emp_code}`}>
                                      <Edit className="h-4 w-4" />
                                    </Link>
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                              No attendance data found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                      <Button
                        onClick={() => fetchData(pagination.currentPage - 1)}
                        disabled={pagination.currentPage === 1}
                        variant="outline"
                        size="sm"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>
                      <div className="px-4 py-2 bg-muted rounded-md text-sm font-medium">
                        Page {pagination.currentPage} of {pagination.totalPages}
                      </div>
                      <Button
                        onClick={() => fetchData(pagination.currentPage + 1)}
                        disabled={pagination.currentPage === pagination.totalPages}
                        variant="outline"
                        size="sm"
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  )}

                  {/* Summary Info */}
                  <div className="mt-4 text-sm text-muted-foreground text-center">
                    Showing {data.length > 0 ? (pagination.currentPage - 1) * pagination.limit + 1 : 0} to{' '}
                    {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of{' '}
                    {pagination.totalCount} employees
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
