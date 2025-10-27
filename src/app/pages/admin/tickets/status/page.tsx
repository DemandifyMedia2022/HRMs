'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarConfig } from '@/components/sidebar-config';
import { toast } from 'sonner';

interface Complaint {
  id: number;
  name: string;
  department: string;
  issuse_type: string;
  reason: string;
  added_by_user: string;
  status: string | null;
  raisedate: string;
  resolved_date: string | null;
  resolution_comment: string | null;
  resolved_by: string | null;
  acknowledgement_status: string | null;
  acknowledgement_by: string | null;
  acknowledgement_date: string | null;
}

export default function RaiseTicketsPage() {
  const router = useRouter();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<string>('');
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const [filter, setFilter] = useState<string>('all');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [resolutionComment, setResolutionComment] = useState('');
  const [resolving, setResolving] = useState(false);
  const [acknowledging, setAcknowledging] = useState(false);
  const [isDepartmentUser, setIsDepartmentUser] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchUserAndComplaints();
  }, []);

  // Map email to complaint types they should see
  function getComplaintTypesForEmail(email: string): string[] {
    const emailLower = email.toLowerCase();

    if (emailLower === 'shraddha.adhav@demandifymedia.com') {
      return ['HRMs', 'HARITECH HRMS Portal Issue'];
    } else if (emailLower === 'rutuja.pawar@demandifymedia.com') {
      return ['HariDialer'];
    } else if (emailLower.includes('informationtechnology@demandifymedia.com')) {
      return ['Technical'];
    } else if (emailLower.includes('hr@demandifymedia.com')) {
      return ['HR-related'];
    } else if (emailLower === 'viresh.kumbhar@demandifymedia.com') {
      return ['General'];
    } else if (emailLower.includes('info@demandifymedia.com')) {
      return ['Other'];
    }

    // Default: show tickets raised by this user
    return [];
  }

  async function fetchUserAndComplaints() {
    try {
      // Get current user
      const userRes = await fetch('/api/auth/me');
      if (userRes.ok) {
        const userData = await userRes.json();
        const userName = userData.name || '';
        const userEmail = userData.email || '';
        setCurrentUser(userName);
        setCurrentUserEmail(userEmail);

        // Fetch all complaints
        const res = await fetch('/api/complaints');
        if (res.ok) {
          const data = await res.json();
          const allComplaints = data.data || [];

          // Get complaint types this user should see
          const allowedTypes = getComplaintTypesForEmail(userEmail);

          // Filter complaints
          let filteredComplaints;
          if (allowedTypes.length > 0) {
            // User is a department receiver - show complaints for their department
            setIsDepartmentUser(true);
            filteredComplaints = allComplaints.filter((c: Complaint) => allowedTypes.includes(c.issuse_type));
          } else {
            // Regular user - show only their own complaints
            setIsDepartmentUser(false);
            filteredComplaints = allComplaints.filter(
              (c: Complaint) => c.name === userName || c.added_by_user === userName
            );
          }

          setComplaints(filteredComplaints);
        } else {
          throw new Error('Failed to fetch complaints');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function handleAcknowledge(complaintId: number) {
    setAcknowledging(true);
    try {
      const res = await fetch('/api/complaints', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: complaintId,
          acknowledgement_status: 'Acknowledged',
          acknowledgement_by: currentUser
        })
      });

      if (res.ok) {
        toast.success('Ticket acknowledged successfully! User has been notified via email.');
        fetchUserAndComplaints();
      } else {
        throw new Error('Failed to acknowledge ticket');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to acknowledge ticket');
    } finally {
      setAcknowledging(false);
    }
  }

  async function handleResolve(complaintId: number) {
    if (!resolutionComment.trim()) {
      toast.warning('Please enter a resolution comment');
      return;
    }

    setResolving(true);
    try {
      const res = await fetch('/api/complaints', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: complaintId,
          status: 'Resolved',
          resolution_comment: resolutionComment,
          resolved_by: currentUser
        })
      });

      if (res.ok) {
        toast.success('Complaint resolved successfully!');
        setSelectedComplaint(null);
        setResolutionComment('');
        fetchUserAndComplaints();
      } else {
        throw new Error('Failed to resolve complaint');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to resolve complaint');
    } finally {
      setResolving(false);
    }
  }

  const filteredComplaints = complaints.filter(complaint => {
    if (filter === 'all') return true;
    if (filter === 'pending') return complaint.status?.toLowerCase() === 'pending' && !complaint.acknowledgement_status;
    if (filter === 'acknowledged')
      return (
        complaint.acknowledgement_status?.toLowerCase() === 'acknowledged' &&
        complaint.status?.toLowerCase() !== 'resolved'
      );
    if (filter === 'resolved') return complaint.status?.toLowerCase() === 'resolved';
    return true;
  });

  const getStatusColor = (status: string | null, acknowledgement: string | null) => {
    if (status?.toLowerCase() === 'resolved') {
      return 'bg-green-100 text-green-800';
    }
    if (acknowledgement?.toLowerCase() === 'acknowledged') {
      return 'bg-blue-100 text-blue-800';
    }
    if (status?.toLowerCase() === 'pending') {
      return 'bg-yellow-100 text-yellow-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <SidebarConfig role="admin" />
      <div className="p-6">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-6 flex justify-between items-start">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900">
                {isDepartmentUser ? 'Department Tickets' : 'My Raised Tickets'}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {isDepartmentUser ? 'Tickets assigned to your department' : 'View your submitted tickets'}
              </p>
            </div>

            {/* View Toggle */}
            <div className="flex gap-2 bg-white border rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 rounded-md transition-colors flex items-center gap-2 ${
                  viewMode === 'grid' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="Grid View"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
                <span className="text-sm font-medium">Grid</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-md transition-colors flex items-center gap-2 ${
                  viewMode === 'list' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="List View"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span className="text-sm font-medium">List</span>
              </button>
            </div>
          </div>

          {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>}

          {/* Filter Tabs */}
          <div className="mb-6 flex gap-2 border-b bg-white px-4 rounded-t-lg">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 font-medium transition-colors ${
                filter === 'all' ? 'border-b-2 border-primary text-primary' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All ({complaints.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 font-medium transition-colors ${
                filter === 'pending' ? 'border-b-2 border-primary text-primary' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Pending (
              {complaints.filter(c => c.status?.toLowerCase() === 'pending' && !c.acknowledgement_status).length})
            </button>
            <button
              onClick={() => setFilter('acknowledged')}
              className={`px-4 py-2 font-medium transition-colors ${
                filter === 'acknowledged'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Acknowledged (
              {
                complaints.filter(
                  c =>
                    c.acknowledgement_status?.toLowerCase() === 'acknowledged' && c.status?.toLowerCase() !== 'resolved'
                ).length
              }
              )
            </button>
            <button
              onClick={() => setFilter('resolved')}
              className={`px-4 py-2 font-medium transition-colors ${
                filter === 'resolved' ? 'border-b-2 border-primary text-primary' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Resolved ({complaints.filter(c => c.status?.toLowerCase() === 'resolved').length})
            </button>
          </div>

          {/* Complaints Grid/List */}
          {filteredComplaints.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600 text-lg">No tickets found</p>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
              {filteredComplaints.map(complaint => (
                <div
                  key={complaint.id}
                  className={`bg-white border rounded-lg p-5 hover:shadow-lg transition-shadow ${
                    viewMode === 'grid' ? 'flex flex-col' : 'flex flex-row gap-6'
                  }`}
                >
                  {/* Left Section (Header + User Info) */}
                  <div className={viewMode === 'list' ? 'flex-shrink-0 w-64' : 'w-full'}>
                    {/* Header */}
                    <div className="mb-3">
                      <div className="flex justify-between items-start mb-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                            complaint.status,
                            complaint.acknowledgement_status
                          )}`}
                        >
                          {complaint.status?.toLowerCase() === 'resolved'
                            ? 'Resolved'
                            : complaint.acknowledgement_status?.toLowerCase() === 'acknowledged'
                              ? 'Acknowledged'
                              : 'Pending'}
                        </span>
                        <span className="text-xs text-gray-500">#{complaint.id}</span>
                      </div>
                      <h3 className="text-base font-bold text-gray-900 mb-1">{complaint.issuse_type}</h3>
                      <p className="text-xs text-gray-500">{new Date(complaint.raisedate).toLocaleDateString()}</p>
                    </div>

                    {/* User Info */}
                    <div className={`space-y-2 ${viewMode === 'grid' ? 'mb-3 pb-3 border-b' : ''}`}>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">{complaint.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                        <span className="text-sm text-gray-600">{complaint.department}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Section (Reason + Actions) */}
                  <div className={`flex flex-col ${viewMode === 'list' ? 'flex-1' : 'w-full'}`}>
                    {/* Reason */}
                    <div className={`mb-4 ${viewMode === 'list' ? 'flex-1' : 'flex-grow'}`}>
                      <p className="text-xs text-gray-600 mb-1 font-medium">Reason:</p>
                      <p className={`text-sm text-gray-800 ${viewMode === 'grid' ? 'line-clamp-3' : ''}`}>
                        {complaint.reason}
                      </p>
                    </div>

                    {/* Actions / Resolution */}
                    {complaint.status?.toLowerCase() === 'resolved' && complaint.resolution_comment ? (
                      <div className="mt-auto pt-3 border-t">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <p className="text-xs font-semibold text-green-900 mb-1">✓ Resolved</p>
                          <p className="text-xs text-green-800 line-clamp-2">{complaint.resolution_comment}</p>
                          {complaint.resolved_by && (
                            <p className="text-xs text-green-600 mt-1">by {complaint.resolved_by}</p>
                          )}
                        </div>
                      </div>
                    ) : complaint.acknowledgement_status?.toLowerCase() === 'acknowledged' ? (
                      <div className="mt-auto pt-3 border-t">
                        {isDepartmentUser ? (
                          selectedComplaint?.id === complaint.id ? (
                            <div className="space-y-2">
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-2">
                                <p className="text-xs font-semibold text-blue-900">
                                  ✓ Acknowledged by {complaint.acknowledgement_by}
                                </p>
                              </div>
                              <textarea
                                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter resolution..."
                                value={resolutionComment}
                                onChange={e => setResolutionComment(e.target.value)}
                                rows={2}
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleResolve(complaint.id)}
                                  disabled={resolving}
                                  className="flex-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                                >
                                  {resolving ? '...' : '✓ Resolve'}
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedComplaint(null);
                                    setResolutionComment('');
                                  }}
                                  className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                                <p className="text-xs font-semibold text-blue-900">
                                  ✓ Acknowledged by {complaint.acknowledgement_by}
                                </p>
                              </div>
                              <button
                                onClick={() => setSelectedComplaint(complaint)}
                                className="w-full px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                              >
                                Resolve Ticket
                              </button>
                            </div>
                          )
                        ) : (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-xs font-semibold text-blue-900 mb-1">✓ Acknowledged</p>
                            <p className="text-xs text-blue-800">by {complaint.acknowledgement_by}</p>
                          </div>
                        )}
                      </div>
                    ) : isDepartmentUser ? (
                      <div className="mt-auto pt-3 border-t flex justify-center">
                        <button
                          onClick={() => handleAcknowledge(complaint.id)}
                          disabled={acknowledging}
                          className="px-5 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary transition-colors disabled:opacity-50 mx-auto"
                        >
                          {acknowledging ? '...' : ' Acknowledge Ticket'}
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
