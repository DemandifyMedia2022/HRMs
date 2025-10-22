'use client';

import { useEffect, useMemo, useState } from 'react';
import { SidebarConfig } from '@/components/sidebar-config';

type StatusRecord = {
  f_id: number;
  f_campaign_name: string;
  f_lead: string;
  f_email_status: string;
  f_qa_status: string;
  f_delivary_status: string;
  form_status: string;
  f_date: string;
};

export default function StatusPage() {
  const [records, setRecords] = useState<StatusRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/status')
      .then(res => res.json())
      .then(json => {
        if (json.error) throw new Error(json.error);
        setRecords(json.data || []);
      })
      .catch(err => setError(String(err)))
      .finally(() => setLoading(false));
  }, []);

  // Group by campaign
  const campaigns = useMemo(() => {
    const map = new Map<
      string,
      { total: number; pending: number; approved: number; rejected: number; lastDate: string | null }
    >();
    for (const r of records) {
      const key = r.f_campaign_name || 'Unknown';
      const entry = map.get(key) || { total: 0, pending: 0, approved: 0, rejected: 0, lastDate: null };
      entry.total += 1;
      const qa = (r.f_qa_status || '').toLowerCase();
      if (qa === 'approved') entry.approved += 1;
      else if (qa === 'rejected') entry.rejected += 1;
      else entry.pending += 1;
      const d = r.f_date ? new Date(r.f_date) : null;
      if (d) {
        const iso = d.toISOString();
        if (!entry.lastDate || iso > entry.lastDate) entry.lastDate = iso;
      }
      map.set(key, entry);
    }
    return Array.from(map.entries()).map(([name, s]) => ({ name, ...s }));
  }, [records]);

  return (
    <>
      <SidebarConfig role="user" />
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Form Status Overview</h1>
        <p className="text-muted-foreground mb-6">
          Overview by campaign. Click a campaign to see its records and start the pending queue.
        </p>

        {loading ? (
          <div className="text-sm text-gray-600">Loading status data...</div>
        ) : error ? (
          <div className="text-sm text-red-600">Error: {error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Campaign
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Pending
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Approved
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Rejected
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Last Updated
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {campaigns.map(c => (
                  <tr key={c.name} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                      <a href={`/pages/status/campaign/${encodeURIComponent(c.name)}`} className="hover:underline">
                        {c.name}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{c.total}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{c.pending}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{c.approved}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{c.rejected}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {c.lastDate ? new Date(c.lastDate).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {campaigns.length === 0 && (
              <div className="text-center py-8 text-sm text-gray-500">No campaigns found.</div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
