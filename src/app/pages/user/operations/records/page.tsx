'use client';

import * as React from 'react';
import { useState } from 'react';
import { SidebarConfig } from '@/components/sidebar-config';
import { SidebarInset } from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/useAuth';

type FormDataRecord = {
  f_id: number;
  f_campaign_name: string | null;
  f_lead: string | null;
  f_resource_name: string | null;
  f_data_source: string | null;
  f_salutation: string | null;
  f_first_name: string | null;
  f_last_name: string | null;
  f_job_title: string | null;
  f_department: string | null;
  f_job_level: string | null;
  f_email_add: string | null;
  Secondary_Email: string | null;
  f_conatct_no: string | null;
  f_company_name: string | null;
  f_website: string | null;
  f_address1: string | null;
  f_city: string | null;
  f_state: string | null;
  f_zip_code: string | null;
  f_country: string | null;
  f_emp_size: string | null;
  f_industry: string | null;
  f_sub_industry: string | null;
  f_revenue: string | null;
  f_revenue_link: string | null;
  f_profile_link: string | null;
  f_company_link: string | null;
  f_address_link: string | null;
  f_date: string | null;
  added_by_user_id: string | null;
};

export default function RecordsPage() {
  const { user } = useAuth();
  const [records, setRecords] = useState<FormDataRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      console.log('Fetching records from /api/forms...');
      const response = await fetch('/api/forms?today=1', {
        credentials: 'include'
      });
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to fetch records: ${response.status} ${errorText}`);
      }
      
      const result = await response.json();
      console.log('API response:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch records');
      }
      
      setRecords(result.data || []);
      console.log('Records set:', result.data?.length || 0, 'records');
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
  };

  const getFullName = (firstName: string | null, lastName: string | null) => {
    if (firstName && lastName) return `${firstName} ${lastName}`;
    if (firstName) return firstName;
    if (lastName) return lastName;
    return '-';
  };

  return (
    <div>
      <SidebarConfig role="user" />
      <SidebarInset>
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <div className="border-b pb-4">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Form Records</h1>
                <p className="mt-2 text-sm text-gray-600">View and manage all submitted form data records.</p>
              </div>
            </div>

            {loading && (
              <div className="text-sm text-gray-600">Loading records...</div>
            )}
            
            {error && (
              <div className="text-sm text-red-600">Error: {error}</div>
            )}
            
            {!loading && !error && (
              <div className="overflow-x-auto">
                <div className="text-sm text-gray-600 mb-2">Total Today: {records.length}</div>
                {records.length === 0 ? (
                  <div className="text-sm text-gray-500">No records found.</div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Campaign</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Lead</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Resource</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Data Source</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {records.map((record, index) => (
                        <tr key={record.f_id}>
                          <td className="px-4 py-2 text-sm text-gray-700">{index + 1}</td>
                          <td className="px-4 py-2 text-sm text-gray-700">{record.f_campaign_name || '-'}</td>
                          <td className="px-4 py-2 text-sm text-gray-700">{record.f_lead || '-'}</td>
                          <td className="px-4 py-2 text-sm text-gray-700">{record.f_resource_name || '-'}</td>
                          <td className="px-4 py-2 text-sm text-gray-700">{record.f_data_source || '-'}</td>
                          <td className="px-4 py-2 text-sm text-gray-700">
                            {getFullName(record.f_first_name, record.f_last_name)}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-700">{record.f_email_add || '-'}</td>
                          <td className="px-4 py-2 text-sm text-gray-700">{record.f_conatct_no || '-'}</td>
                          <td className="px-4 py-2 text-sm text-gray-700">{record.f_company_name || '-'}</td>
                          <td className="px-4 py-2 text-sm text-gray-700">{formatDate(record.f_date)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
    </div>
  );
}
