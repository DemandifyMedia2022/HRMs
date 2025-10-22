'use client';

import { useState, useEffect } from 'react';
import { SidebarConfig } from '@/components/sidebar-config';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IconSearch, IconDownload } from '@tabler/icons-react';

interface BankChallanData {
  id: number;
  emp_code: string | null;
  Full_name: string | null;
  employment_status: string | null;
  company_name: string | null;
  Business_unit: string | null;
  department: string | null;
  job_role: string | null;
  branch: string | null;
  joining_date: string | null;
  pan_card_no: string | null;
  UAN: string | null;
  bank_name: string | null;
  IFSC_code: string | null;
  Account_no: string | null;
  employment_type: string | null;
  contact_no: string | null;
  Personal_Email: string | null;
  email: string | null;
  CTC: string | null;
  gross_salary: string | null;
  Basic_Monthly_Remuneration: string | null;
  HRA_Monthly_Remuneration: string | null;
  OTHER_ALLOWANCE_Monthly_Remuneration: string | null;
  PF_Monthly_Contribution: string | null;
  Employee_Esic_Monthly: number | null;
  netSalary: string | null;
  pay_days?: number;
  lop_days?: number;
  basic_earned?: string;
  hra_earned?: string;
  other_earned?: string;
  total_earning?: string;
  income_tax?: string;
  professional_tax?: string;
  total_deduction?: string;
  net_pay?: string;
}

export default function BankChallanPage() {
  const [data, setData] = useState<BankChallanData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [month, setMonth] = useState('');
  const [downloadMonth, setDownloadMonth] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (searchTerm = '', filterMonth = '') => {
    try {
      setLoading(true);
      setError(null);
      let url = '/api/bank-challan';
      const params = new URLSearchParams();

      if (searchTerm) params.append('search', searchTerm);
      if (filterMonth) params.append('month', filterMonth);

      if (params.toString()) url += `?${params.toString()}`;

      console.log('Fetching from:', url);
      const response = await fetch(url, {
        credentials: 'include'
      });

      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('API Response:', result);

      if (result.success) {
        setData(result.data || []);
        console.log('Data loaded:', result.data?.length, 'records');
      } else {
        setError(result.error || 'Failed to fetch data');
        console.error('Failed to fetch data:', result.error);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMsg);
      console.error('Error fetching bank challan:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData(search, month);
  };

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!downloadMonth) {
      alert('Please select a month to download');
      return;
    }

    try {
      // Build download URL
      let url = '/api/bank-challan/download';
      const params = new URLSearchParams();
      params.append('month', downloadMonth);
      if (search) params.append('search', search);
      url += `?${params.toString()}`;

      // Trigger download by opening in new window
      const link = document.createElement('a');
      link.href = url;
      link.download = `Bank_Report_${downloadMonth}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert('Download started! Check your downloads folder.');
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download. Please try again.');
    }
  };

  const getCurrentDate = () => {
    const today = new Date();
    return today.toLocaleDateString('en-GB');
  };

  if (loading) {
    return (
      <>
        <SidebarConfig role="hr" />
        <div className="flex flex-1 items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-slate-300 border-t-slate-600 dark:border-slate-700 dark:border-t-slate-400 mb-3"></div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Loading...</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="p-4 space-y-3 bg-slate-50 dark:bg-slate-950 overflow-x-hidden">
        <SidebarConfig role="hr" />

        {/* Filters & Actions */}
        <Card className="rounded border border-slate-200 dark:border-slate-800 max-w-[1200px]">
          <CardContent className="py-2 px-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <div>
                <Label htmlFor="search" className="text-[11px] mb-1 block">
                  Search
                </Label>
                <Input
                  id="search"
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Name or Code"
                  className="h-8"
                />
              </div>

              <div>
                <Label htmlFor="month" className="text-[11px] mb-1 block">
                  Month
                </Label>
                <Input id="month" type="month" value={month} onChange={e => setMonth(e.target.value)} className="h-8" />
              </div>

              <div>
                <Label className="text-[11px] mb-1 block">&nbsp;</Label>
                <Button
                  onClick={e => {
                    e.preventDefault();
                    fetchData(search, month);
                  }}
                  className="w-full h-8"
                  size="sm"
                >
                  Search
                </Button>
              </div>

              <div>
                <Label className="text-[11px] mb-1 block">&nbsp;</Label>
                <form onSubmit={handleDownload} className="flex gap-2">
                  <Input
                    type="month"
                    value={downloadMonth}
                    onChange={e => setDownloadMonth(e.target.value)}
                    required
                    placeholder="Month"
                    className="h-8"
                  />
                  <Button type="submit" variant="outline" className="h-8 px-2" size="sm">
                    <IconDownload className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded max-w-[1200px] overflow-hidden">
          <div className="border-b border-slate-200 dark:border-slate-800 px-3 lg:px-4 py-2">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Employee Records ({data.length})
            </h2>
          </div>
          <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-260px)] w-full">
            <table className="min-w-[1200px] text-xs">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-100 dark:bg-slate-800">
                  <th className="border border-slate-300 dark:border-slate-700 px-2.5 py-2 text-left font-medium text-xs">
                    Sr No
                  </th>
                  <th className="border border-slate-300 dark:border-slate-700 px-3 py-2 text-left font-medium text-sm">
                    Emp Code
                  </th>
                  <th className="border border-slate-300 dark:border-slate-700 px-3 py-2 text-left font-medium text-sm">
                    Full Name
                  </th>
                  <th className="border border-slate-300 dark:border-slate-700 px-3 py-2 text-left font-medium text-sm">
                    Employment Status
                  </th>
                  <th className="border border-slate-300 dark:border-slate-700 px-3 py-2 text-left font-medium text-sm">
                    Company
                  </th>
                  <th className="border border-slate-300 dark:border-slate-700 px-3 py-2 text-left font-medium text-sm">
                    Business Unit
                  </th>
                  <th className="border border-slate-300 dark:border-slate-700 px-3 py-2 text-left font-medium text-sm">
                    Department
                  </th>
                  <th className="border border-slate-300 dark:border-slate-700 px-3 py-2 text-left font-medium text-sm">
                    Designation
                  </th>
                  <th className="border border-slate-300 dark:border-slate-700 px-3 py-2 text-left font-medium text-sm">
                    Branch
                  </th>
                  <th className="border border-slate-300 dark:border-slate-700 px-3 py-2 text-left font-medium text-sm">
                    Date of Joining
                  </th>
                  <th className="border border-slate-300 dark:border-slate-700 px-3 py-2 text-left font-medium text-sm">
                    PAN No
                  </th>
                  <th className="border border-slate-300 dark:border-slate-700 px-3 py-2 text-left font-medium text-sm">
                    UAN No
                  </th>
                  <th className="border border-slate-300 dark:border-slate-700 px-3 py-2 text-left font-medium text-sm">
                    Payment Type
                  </th>
                  <th className="border border-slate-300 dark:border-slate-700 px-3 py-2 text-left font-medium text-sm">
                    Payment Mode
                  </th>
                  <th className="border border-slate-300 dark:border-slate-700 px-3 py-2 text-left font-medium text-sm">
                    Bank Name
                  </th>
                  <th className="border border-slate-300 dark:border-slate-700 px-3 py-2 text-left font-medium text-sm">
                    Bank Branch
                  </th>
                  <th className="border border-slate-300 dark:border-slate-700 px-3 py-2 text-left font-medium text-sm">
                    IFSC
                  </th>
                  <th className="border border-slate-300 dark:border-slate-700 px-3 py-2 text-left font-medium text-sm">
                    Account No
                  </th>
                  <th className="border border-slate-300 dark:border-slate-700 px-3 py-2 text-left font-medium text-sm">
                    Process Date
                  </th>
                  <th className="border border-slate-300 dark:border-slate-700 px-3 py-2 text-left font-medium text-sm">
                    Release Date
                  </th>
                  <th className="border border-slate-300 dark:border-slate-700 px-3 py-2 text-left font-medium text-sm">
                    Amount
                  </th>
                  <th className="border border-slate-300 dark:border-slate-700 px-3 py-2 text-left font-medium text-sm">
                    Employment Type
                  </th>
                  <th className="border border-slate-300 dark:border-slate-700 px-3 py-2 text-left font-medium text-sm">
                    First Name
                  </th>
                  <th className="border border-slate-300 dark:border-slate-700 px-3 py-2 text-left font-medium text-sm">
                    Grade
                  </th>
                  <th className="border border-slate-300 dark:border-slate-700 px-3 py-2 text-left font-medium text-sm">
                    Level
                  </th>
                  <th className="border border-slate-300 dark:border-slate-700 px-3 py-2 text-left font-medium text-sm">
                    Mobile Number
                  </th>
                  <th className="border border-slate-300 dark:border-slate-700 px-3 py-2 text-left font-medium text-sm">
                    Personal Email
                  </th>
                  <th className="border border-slate-300 dark:border-slate-700 px-3 py-2 text-left font-medium text-sm">
                    Region
                  </th>
                  <th className="border border-slate-300 dark:border-slate-700 px-3 py-2 text-left font-medium text-sm">
                    Sub Department
                  </th>
                  <th className="border border-slate-300 dark:border-slate-700 px-3 py-2 text-left font-medium text-sm">
                    Work Email
                  </th>
                  <th className="border border-slate-300 dark:border-slate-700 px-3 py-2 text-left font-medium text-sm">
                    CTC
                  </th>
                  <th className="border border-slate-300 dark:border-slate-700 px-3 py-2 text-left font-medium text-sm">
                    Monthly Gross Salary
                  </th>
                  <th className="border border-slate-300 dark:border-slate-700 px-3 py-2 text-left font-medium text-sm">
                    BASIC(R)
                  </th>
                  <th className="border border-slate-300 dark:border-slate-700 px-3 py-2 text-left font-medium text-sm">
                    HRA(R)
                  </th>
                  <th className="border border-slate-300 dark:border-slate-700 px-3 py-2 text-left font-medium text-sm">
                    OTHER ALLOWANCE(R)
                  </th>
                  <th className="border border-slate-300 dark:border-slate-700 px-3 py-2 text-left font-medium text-sm">
                    Paid Days
                  </th>
                  <th className="border border-slate-300 dark:border-slate-700 px-3 py-2 text-left font-medium text-sm">
                    LOP Days
                  </th>
                  <th className="border border-slate-300 dark:border-slate-700 px-3 py-2 text-left font-medium text-sm">
                    Basic
                  </th>
                  <th className="border border-slate-300 dark:border-slate-700 px-3 py-2 text-left font-medium text-sm">
                    HRA
                  </th>
                  <th className="border border-slate-300 dark:border-slate-700 px-3 py-2 text-left font-medium text-sm">
                    Other Allowance
                  </th>
                  <th className="border border-slate-300 dark:border-slate-700 px-3 py-2 text-left font-medium text-sm">
                    Total Earning
                  </th>
                  <th className="border border-slate-300 dark:border-slate-700 px-3 py-2 text-left font-medium text-sm">
                    EPF
                  </th>
                  <th className="border border-slate-300 dark:border-slate-700 px-3 py-2 text-left font-medium text-sm">
                    ESI
                  </th>
                  <th className="border border-slate-300 dark:border-slate-700 px-3 py-2 text-left font-medium text-sm">
                    Income Tax
                  </th>
                  <th className="border border-slate-300 dark:border-slate-700 px-3 py-2 text-left font-medium text-sm">
                    Professional Tax
                  </th>
                  <th className="border border-slate-300 dark:border-slate-700 px-3 py-2 text-left font-medium text-sm">
                    Total Deductions
                  </th>
                  <th className="border border-slate-300 dark:border-slate-700 px-3 py-2 text-left font-medium text-sm">
                    Net Pay
                  </th>
                  <th className="border border-slate-300 dark:border-slate-700 px-3 py-2 text-left font-medium text-sm">
                    Arrears
                  </th>
                  <th className="border border-slate-300 dark:border-slate-700 px-3 py-2 text-left font-medium text-sm">
                    Incentive
                  </th>
                  <th className="border border-slate-300 dark:border-slate-700 px-3 py-2 text-left font-medium text-sm">
                    Total Net Pay
                  </th>
                  <th className="border border-slate-300 dark:border-slate-700 px-3 py-2 text-left font-medium text-sm">
                    Comments
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.length > 0 &&
                  data.map((row, index) => (
                    <tr
                      key={row.id}
                      className={index % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-850'}
                    >
                      <td className="border border-slate-300 dark:border-slate-600 px-2.5 py-1.5">{index + 1}</td>
                      <td className="border border-slate-300 dark:border-slate-600 px-2.5 py-1.5 font-medium">
                        {row.emp_code || ''}
                      </td>
                      <td className="border border-slate-300 dark:border-slate-600 px-2.5 py-1.5 font-medium">
                        {row.Full_name || ''}
                      </td>
                      <td className="border border-slate-300 dark:border-slate-600 px-2.5 py-1.5">
                        {row.employment_status || ''}
                      </td>
                      <td className="border border-slate-300 dark:border-slate-600 px-2.5 py-1.5">
                        {row.company_name || ''}
                      </td>
                      <td className="border border-slate-300 dark:border-slate-600 px-2.5 py-1.5">
                        {row.Business_unit || ''}
                      </td>
                      <td className="border border-slate-300 dark:border-slate-600 px-2.5 py-1.5">
                        {row.department || ''}
                      </td>
                      <td className="border border-slate-300 dark:border-slate-600 px-2.5 py-1.5">
                        {row.job_role || ''}
                      </td>
                      <td className="border border-slate-300 dark:border-slate-600 px-2.5 py-1.5">
                        {row.branch || ''}
                      </td>
                      <td className="border border-slate-300 dark:border-slate-600 px-2.5 py-1.5">
                        {row.joining_date || ''}
                      </td>
                      <td className="border border-slate-300 dark:border-slate-600 px-2.5 py-1.5">
                        {row.pan_card_no || ''}
                      </td>
                      <td className="border border-slate-300 dark:border-slate-600 px-2.5 py-1.5">{row.UAN || ''}</td>
                      <td className="border border-slate-300 dark:border-slate-600 px-2.5 py-1.5">Salary</td>
                      <td className="border border-slate-300 dark:border-slate-600 px-2.5 py-1.5">Online Transfer</td>
                      <td className="border border-slate-300 dark:border-slate-600 px-2.5 py-1.5">
                        {row.bank_name || ''}
                      </td>
                      <td className="border border-slate-300 dark:border-slate-600 px-2.5 py-1.5">
                        {row.bank_name || ''}
                      </td>
                      <td className="border border-slate-300 dark:border-slate-600 px-2.5 py-1.5">
                        {row.IFSC_code || ''}
                      </td>
                      <td className="border border-slate-300 dark:border-slate-600 px-2.5 py-1.5">
                        {row.Account_no || ''}
                      </td>
                      <td className="border border-slate-300 dark:border-slate-600 px-2.5 py-1.5">
                        {getCurrentDate()}
                      </td>
                      <td className="border border-slate-300 dark:border-slate-600 px-2.5 py-1.5">
                        {getCurrentDate()}
                      </td>
                      <td className="border border-slate-300 dark:border-slate-600 px-2.5 py-1.5 font-semibold text-green-600 dark:text-green-400">
                        {row.net_pay || row.netSalary || ''}
                      </td>
                      <td className="border border-slate-300 dark:border-slate-600 px-2.5 py-1.5">
                        {row.employment_type || ''}
                      </td>
                      <td className="border border-slate-300 dark:border-slate-600 px-2.5 py-1.5">
                        {row.Full_name || ''}
                      </td>
                      <td className="border border-slate-300 dark:border-slate-600 px-2.5 py-1.5 text-slate-400">NA</td>
                      <td className="border border-slate-300 dark:border-slate-600 px-2.5 py-1.5 text-slate-400">NA</td>
                      <td className="border border-slate-300 dark:border-slate-600 px-2.5 py-1.5">
                        {row.contact_no || ''}
                      </td>
                      <td className="border border-slate-300 dark:border-slate-600 px-2.5 py-1.5">
                        {row.Personal_Email || ''}
                      </td>
                      <td className="border border-slate-300 dark:border-slate-600 px-2.5 py-1.5">West</td>
                      <td className="border border-slate-300 dark:border-slate-600 px-2.5 py-1.5">
                        {row.department || ''}
                      </td>
                      <td className="border border-slate-300 dark:border-slate-600 px-2.5 py-1.5">{row.email || ''}</td>
                      <td className="border border-slate-300 dark:border-slate-600 px-2.5 py-1.5">{row.CTC || ''}</td>
                      <td className="border border-slate-300 dark:border-slate-600 px-2.5 py-1.5">
                        {row.gross_salary || ''}
                      </td>
                      <td className="border border-slate-300 dark:border-slate-600 px-2.5 py-1.5">
                        {row.Basic_Monthly_Remuneration || ''}
                      </td>
                      <td className="border border-slate-300 dark:border-slate-600 px-2.5 py-1.5">
                        {row.HRA_Monthly_Remuneration || ''}
                      </td>
                      <td className="border border-slate-300 dark:border-slate-600 px-2.5 py-1.5">
                        {row.OTHER_ALLOWANCE_Monthly_Remuneration || ''}
                      </td>
                      <td className="border border-slate-300 dark:border-slate-600 px-2.5 py-1.5">
                        {row.pay_days || ''}
                      </td>
                      <td className="border border-slate-300 dark:border-slate-600 px-2.5 py-1.5">
                        {row.lop_days || ''}
                      </td>
                      <td className="border border-slate-300 dark:border-slate-600 px-2.5 py-1.5">
                        {row.basic_earned || ''}
                      </td>
                      <td className="border border-slate-300 dark:border-slate-600 px-2.5 py-1.5">
                        {row.hra_earned || ''}
                      </td>
                      <td className="border border-slate-300 dark:border-slate-600 px-2.5 py-1.5">
                        {row.other_earned || ''}
                      </td>
                      <td className="border border-slate-300 dark:border-slate-600 px-2.5 py-1.5">
                        {row.total_earning || ''}
                      </td>
                      <td className="border border-slate-300 dark:border-slate-600 px-2.5 py-1.5">
                        {row.PF_Monthly_Contribution || ''}
                      </td>
                      <td className="border border-slate-300 dark:border-slate-600 px-2.5 py-1.5">
                        {row.Employee_Esic_Monthly || ''}
                      </td>
                      <td className="border border-slate-300 dark:border-slate-600 px-2.5 py-1.5">
                        {row.income_tax || ''}
                      </td>
                      <td className="border border-slate-300 dark:border-slate-600 px-2.5 py-1.5">
                        {row.professional_tax || ''}
                      </td>
                      <td className="border border-slate-300 dark:border-slate-600 px-2.5 py-1.5">
                        {row.total_deduction || ''}
                      </td>
                      <td className="border border-slate-300 dark:border-slate-600 px-2.5 py-1.5 font-semibold">
                        {row.net_pay || ''}
                      </td>
                      <td className="border border-slate-300 dark:border-slate-600 px-2.5 py-1.5"></td>
                      <td className="border border-slate-300 dark:border-slate-600 px-2.5 py-1.5"></td>
                      <td className="border border-slate-300 dark:border-slate-600 px-2.5 py-1.5 font-semibold">
                        {row.net_pay || ''}
                      </td>
                      <td className="border border-slate-300 dark:border-slate-600 px-2.5 py-1.5"></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded p-4 text-sm text-red-800 dark:text-red-200">
            Error: {error}
          </div>
        )}
      </div>
    </>
  );
}
