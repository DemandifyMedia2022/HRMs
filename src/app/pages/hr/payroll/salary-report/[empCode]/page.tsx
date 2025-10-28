'use client';

import { useState, useEffect } from 'react';
import { SidebarConfig } from '@/components/sidebar-config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Download, ArrowLeft } from 'lucide-react';
import { useParams } from 'next/navigation';

interface AnnualReportData {
  user: {
    Full_name: string;
    emp_code: string;
  };
  fiscalMonths: string[];
  report: Record<string, Record<string, number>>;
}

export default function AnnualSalaryReportPage() {
  const params = useParams();
  const empCode = params?.empCode as string;

  const [data, setData] = useState<AnnualReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (empCode) {
      fetchData();
    }
  }, [empCode]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/payroll/annual-report/${empCode}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        console.error('Failed to fetch data:', result.error);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    if (!data) return;

    const headers = ['Component', ...data.fiscalMonths, 'Total'];
    const rows = Object.entries(data.report).map(([component, values]) => {
      const row = [component];
      data.fiscalMonths.forEach(month => {
        row.push(values[month]?.toFixed(2) || '0.00');
      });
      row.push(values['Total']?.toFixed(2) || '0.00');
      return row;
    });

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Annual_Salary_Report_${empCode}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <>
        <SidebarConfig role="hr" />
        <div className="flex min-h-screen bg-gray-50">
          <div className="flex-1 p-6 ml-auto" style={{ width: '95%' }}>
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading annual report...</p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <SidebarConfig role="hr" />
        <div className="flex min-h-screen bg-gray-50">
          <div className="flex-1 p-6 ml-auto" style={{ width: '95%' }}>
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No data available</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SidebarConfig role="hr" />
      <div className="flex min-h-screen bg-gray-50">
        <div className="flex-1 p-6 ml-auto" style={{ width: '95%' }}>
          {/* Header Card */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold text-primary mb-2">Annual Salary Report</CardTitle>
                  <p className="text-muted-foreground">
                    <span className="font-semibold text-foreground">{data.user.Full_name}</span> ({data.user.emp_code})
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button onClick={handleDownloadCSV} variant="default" className="bg-green-600 hover:bg-green-700">
                    <Download className="mr-2 h-4 w-4" />
                    Download CSV
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/pages/hr/payroll/tax/process-attendance">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Link>
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Table Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-primary text-primary-foreground">
                    <tr>
                      <th className="px-3 py-3 text-left font-semibold sticky left-0 bg-primary z-10">Component</th>
                      {data.fiscalMonths.map(month => (
                        <th key={month} className="px-3 py-3 text-center font-semibold whitespace-nowrap">
                          {month}
                        </th>
                      ))}
                      <th className="px-3 py-3 text-center font-semibold whitespace-nowrap">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {Object.entries(data.report).map(([component, values], idx) => {
                      const isHighlight =
                        component === 'Total Earnings' ||
                        component === 'Total Deductions' ||
                        component === 'Net Take Home';

                      return (
                        <tr
                          key={component}
                          className={
                            isHighlight ? 'bg-blue-50 font-semibold' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                          }
                        >
                          <td className="px-3 py-2.5 font-medium sticky left-0 bg-inherit z-10 border-r">
                            {component}
                          </td>
                          {data.fiscalMonths.map(month => (
                            <td key={month} className="px-3 py-2.5 text-center whitespace-nowrap">
                              {values[month]?.toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              }) || '0.00'}
                            </td>
                          ))}
                          <td className="px-3 py-2.5 text-center font-semibold whitespace-nowrap bg-gray-100">
                            {values['Total']?.toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            }) || '0.00'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Legend */}
              <div className="mt-4 text-xs text-muted-foreground">
                <p>
                  <span className="font-semibold">Note:</span> This report shows fiscal year data from April to March.
                  Highlighted rows indicate summary calculations.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
