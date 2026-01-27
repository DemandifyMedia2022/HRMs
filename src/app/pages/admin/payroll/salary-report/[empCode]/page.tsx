'use client';

import { useState, useEffect } from 'react';
import { SidebarConfig } from '@/components/sidebar-config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
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
        <SidebarConfig role="admin" />
        <div className="p-6 font-sans">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground font-sans">Loading annual report...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <SidebarConfig role="admin" />
        <div className="p-6 font-sans">
          <Card className="shadow-lg border-0">
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground font-sans">No data available</p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <SidebarConfig role="admin" />
      <div className="flex flex-col h-screen overflow-hidden font-sans">
        {/* Fixed Header - Never scrolls */}
        <div className="flex-shrink-0 p-6 pb-4 bg-background border-b">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Annual Salary Report
              </h1>
              <p className="text-muted-foreground text-lg mt-1">
                <span className="font-semibold text-foreground">{data.user.Full_name}</span> 
                <span className="mx-2">•</span>
                <span className="font-mono text-sm bg-slate-100 px-2 py-1 rounded">{data.user.emp_code}</span>
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={handleDownloadCSV} 
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg font-sans"
              >
                <Download className="mr-2 h-4 w-4" />
                Download CSV
              </Button>
              <Button asChild variant="outline" className="border-2 hover:bg-slate-50 font-sans">
                <Link href="/pages/admin/payroll/tax/process-attendance">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-auto p-6 pt-4">
          {/* Table Card with Scrollable Content */}
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardContent className="p-0">
              {/* Table container with horizontal scroll */}
              <div className="overflow-auto border rounded-lg" style={{ maxHeight: 'calc(100vh - 280px)' }}>
                <table className="w-full text-sm relative font-sans" style={{ minWidth: 'max-content' }}>
                  <thead className="sticky top-0 z-20">
                    <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                      <th className="px-6 py-4 text-left font-semibold sticky left-0 bg-gradient-to-r from-blue-600 to-blue-700 z-30 min-w-[200px] border-r border-blue-500 font-sans shadow-[2px_0_4px_rgba(0,0,0,0.1)]">
                        <span className="text-white">Component</span>
                      </th>
                      {data.fiscalMonths.map(month => (
                        <th key={month} className="px-4 py-4 text-center font-semibold whitespace-nowrap min-w-[120px] border-r border-blue-500 font-sans">
                          <span className="text-white">{month}</span>
                        </th>
                      ))}
                      <th className="px-4 py-4 text-center font-semibold whitespace-nowrap min-w-[140px] bg-gradient-to-r from-blue-700 to-blue-800 font-sans">
                        <span className="text-white">Total</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {Object.entries(data.report).map(([component, values], idx) => {
                      const isHighlight =
                        component === 'Total Earnings' ||
                        component === 'Total Deductions' ||
                        component === 'Net Take Home';

                      return (
                        <tr
                          key={component}
                          className={`
                            transition-colors duration-200 hover:bg-slate-50 font-sans
                            ${isHighlight 
                              ? 'bg-gradient-to-r from-blue-50 to-indigo-50 font-semibold border-l-4 border-blue-500' 
                              : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                            }
                          `}
                        >
                          <td className={`px-6 py-4 font-medium sticky left-0 z-10 min-w-[200px] border-r border-slate-200 font-sans shadow-[2px_0_4px_rgba(0,0,0,0.05)] ${
                            isHighlight 
                              ? 'bg-gradient-to-r from-blue-50 to-indigo-50' 
                              : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                          }`}>
                            <div className="flex items-center">
                              {isHighlight && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 flex-shrink-0"></div>
                              )}
                              <span className={`${isHighlight ? 'text-blue-900' : 'text-slate-700'} whitespace-normal break-words`}>
                                {component}
                              </span>
                            </div>
                          </td>
                          {data.fiscalMonths.map(month => (
                            <td key={month} className="px-4 py-4 text-center whitespace-nowrap text-sm border-r border-slate-200 font-sans min-w-[120px]">
                              <span className={`${isHighlight ? 'font-semibold text-blue-900' : 'text-slate-600'}`}>
                                ₹{values[month]?.toLocaleString('en-IN', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2
                                }) || '0.00'}
                              </span>
                            </td>
                          ))}
                          <td className="px-4 py-4 text-center font-semibold whitespace-nowrap bg-gradient-to-r from-slate-100 to-slate-200 font-sans min-w-[140px]">
                            <span className="text-slate-900">
                              ₹{values['Total']?.toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              }) || '0.00'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Fixed Legend - Never scrolls */}
              <div className="p-6 bg-gradient-to-r from-slate-50 to-slate-100 border-t">
                <div className="flex items-start gap-4 text-sm text-slate-600 font-sans">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="font-medium">Summary Rows</span>
                  </div>
                  <div className="flex-1">
                    <p>
                      <span className="font-semibold text-slate-700">Note:</span> This report shows fiscal year data from April to March.
                      Highlighted rows with blue indicators represent summary calculations for earnings, deductions, and net take-home pay.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
