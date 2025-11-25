'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { SidebarConfig } from '@/components/sidebar-config';
import { useRouteGuard } from '@/hooks/useRouteGuard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
  Tooltip
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { IconCalendar, IconGift, IconChartBar, IconMessage, IconUsers, IconUserCheck, IconUserX, IconClock } from '@tabler/icons-react';

export default function AdminPage() {
  const searchParams = useSearchParams();
  const { user, loading } = useRouteGuard('admin');
  const [year] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(new Date().getMonth());
  const [error, setError] = useState<string>('');

  // Dashboard API states
  const [headcount, setHeadcount] = useState<{ total: number; confirmed: number; probation: number } | null>(null);
  const [gender, setGender] = useState<{ male: number; female: number; other: number } | null>(null);
  const [breakdownBy, setBreakdownBy] = useState<'department'>('department');
  const [breakdown, setBreakdown] = useState<{ name: string; count: number }[]>([]);
  const [attToday, setAttToday] = useState<{ date: string; total: number; present: number; absent: number } | null>(
    null
  );
  const [attYesterday, setAttYesterday] = useState<{
    date: string;
    total: number;
    present: number;
    absent: number;
  } | null>(null);
  const [leavesToday, setLeavesToday] = useState<{ total: number; items: { type: string; count: number }[] } | null>(
    null
  );
  const [events, setEvents] = useState<{
    days: number;
    birthdays: { name: string; date: string }[];
    workAnniversaries: { name: string; date: string; years: number }[];
  } | null>(null);
  const [leavesFuture, setLeavesFuture] = useState<{
    days: number;
    items: { date: string; total: number; types: { type: string; count: number }[] }[];
  } | null>(null);
  const [leaveTrends, setLeaveTrends] = useState<{
    year: number;
    items: { month: number; types: { type: string; count: number }[] }[];
  } | null>(null);
  // Feedback modal state
  interface FeedbackState {
    overall: number;
    culture: number;
    balance: number;
    salary: number;
    growth: number;
    manager: number;
    policies: number;
    recommend: number;
    comments: string;
  }

  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>({
    overall: 0,
    culture: 0,
    balance: 0,
    salary: 0,
    growth: 0,
    manager: 0,
    policies: 0,
    recommend: 0,
    comments: ''
  });
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFeedbackSuccess, setShowFeedbackSuccess] = useState(false);

  const resetFeedback = () => {
    setFeedback({
      overall: 0,
      culture: 0,
      balance: 0,
      salary: 0,
      growth: 0,
      manager: 0,
      policies: 0,
      recommend: 0,
      comments: ''
    });
  };

  const handleFeedbackChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFeedback(prev => ({
      ...prev,
      [name]: name === 'comments' ? value : parseInt(value, 10)
    }));
  };

  const handleRatingClick = (questionId: keyof FeedbackState, value: number) => {
    setFeedback(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Optimistically close the modal right away
    setShowFeedbackModal(false);
    // Immediately clear previous inputs so reopening shows a clean form
    resetFeedback();

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedback),
      });

      if (response.ok) {
        setFeedbackSubmitted(true);
        resetFeedback();
        // ensure submitted flag reset for next open
        setFeedbackSubmitted(false);
        // show success toast briefly
        setShowFeedbackSuccess(true);
        setTimeout(() => setShowFeedbackSuccess(false), 3000);
      } else {
        console.error('Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const [leaveRequests, setLeaveRequests] = useState<{
    status: string;
    total: number;
    items: {
      id: number;
      type: string;
      start: string;
      end: string;
      reason: string;
      hrStatus: string;
      mgrStatus: string;
      requestedBy: string;
      requestedOn: string;
    }[];
  } | null>(null);

  // Load dashboard aggregates
  useEffect(() => {
    // open survey modal if ?survey=1 present
    const s = searchParams?.get('survey');
    if (s === '1') {
      setShowFeedbackModal(true);
    }
  }, [searchParams]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const y = new Date();
        y.setDate(y.getDate() - 1);
        const ymd = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`;
        const [hc, gd, br, at, ay, lt, ev, lf, ltr, lr] = await Promise.all([
          fetch(`/api/admin/dashboard/headcount`).then(r => r.json()),
          fetch(`/api/admin/dashboard/gender`).then(r => r.json()),
          fetch(`/api/admin/dashboard/breakdown?by=department`).then(r => r.json()),
          fetch(`/api/admin/dashboard/attendance-today`).then(r => r.json()),
          fetch(`/api/admin/dashboard/attendance-today?date=${ymd}`).then(r => r.json()),
          fetch(`/api/admin/dashboard/leaves-today`).then(r => r.json()),
          fetch(`/api/admin/dashboard/upcoming-events?days=14`).then(r => r.json()),
          fetch(`/api/admin/dashboard/leaves-future?days=14`).then(r => r.json()),
          fetch(`/api/admin/dashboard/leave-trends?year=${year}`).then(r => r.json()),
          fetch(`/api/admin/dashboard/leave-requests?status=pending&limit=3`).then(r => r.json())
        ]);
        if (ignore) return;
        setHeadcount(hc);
        setGender(gd);
        setBreakdown(br.items || []);
        setAttToday(at);
        setAttYesterday(ay);
        setLeavesToday(lt);
        setEvents(ev);
        setLeavesFuture(lf);
        setLeaveTrends(ltr);
        setLeaveRequests(lr);
      } catch (e: any) {
        if (!ignore) setError(e?.message || 'Failed to load dashboard');
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  // Legacy area chart removed from Admin (replaced by dashboard cards)
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;

  const toSecs = (v?: any) => {
    if (v == null) return 0;
    if (v instanceof Date && !isNaN(v.getTime()))
      return v.getUTCHours() * 3600 + v.getUTCMinutes() * 60 + v.getUTCSeconds();
    const s = String(v).trim();
    const m = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?Z?$/);
    if (m) return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3] || 0);
    const d = new Date(s);
    if (!isNaN(d.getTime())) return d.getUTCHours() * 3600 + d.getUTCMinutes() * 60 + d.getUTCSeconds();
    const n = Number(s);
    return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
  };

  const orgKpis = useMemo(() => {
    return {
      totalEmployees: headcount?.total || 0,
      present: attToday?.present || 0,
      half: 0,
      absent: attToday?.absent || 0,
      total: '--:--:--'
    };
  }, [headcount, attToday]);

  const statusDist = useMemo(
    () => [
      { name: 'Present', count: orgKpis.present },
      { name: 'Absent', count: orgKpis.absent }
    ],
    [orgKpis]
  );

  const dailyHours: { date: string; hours: number }[] = [];

  const chartHoursCfg: ChartConfig = { hours: { label: 'Hours', color: 'hsl(var(--primary))' } };
  const chartDistCfg: ChartConfig = { count: { label: 'Count', color: 'hsl(var(--primary))' } };

  // Build monthly trends dataset
  const trendTypes = useMemo(() => {
    const s = new Set<string>();
    for (const m of leaveTrends?.items || []) for (const t of m.types) s.add(t.type);
    return Array.from(s);
  }, [leaveTrends]);
  const trendData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => ({
      label: new Date(0, i).toLocaleString(undefined, { month: 'short' })
    }));
    for (let i = 0; i < 12; i++) {
      const rec = (leaveTrends?.items || []).find(x => x.month === i);
      for (const t of trendTypes) {
        (months[i] as any)[t] = rec ? rec.types.find(y => y.type === t)?.count || 0 : 0;
      }
    }
    return months as any[];
  }, [leaveTrends, trendTypes]);
  const trendColors = ['#0ea5e9', '#22c55e', '#f97316', '#ef4444', '#a855f7', '#eab308'];

  if (loading) {
    return (
      <div className="p-6">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <SidebarConfig role="hr" />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              Good {(() => {
                const h = new Date().getHours();
                if (h < 12) return 'Morning';
                if (h < 18) return 'Afternoon';
                return 'Evening';
              })()}, {user.name?.split(' ')[0] || user.email?.split('@')[0]}! <span className="text-3xl">👋</span>
            </h1>
            <p className="text-muted-foreground text-lg mt-1">
              Here&apos;s what&apos;s happening in your organization today.
            </p>
            {showFeedbackSuccess && (
              <div className="mt-2 inline-flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
                <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Feedback submitted successfully.
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-violet-200/80 bg-violet-50/70 relative overflow-hidden">
            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-15 pointer-events-none">
              <IconUsers className="w-24 h-24 text-violet-600" />
            </div>
            <CardHeader className="pb-2 relative z-10">
              <CardDescription>Organization</CardDescription>
              <CardTitle className="text-3xl">{headcount?.total ?? 0}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground relative z-10">Total Employees</CardContent>
          </Card>
          <Card className="border-emerald-200/80 bg-emerald-50/70 relative overflow-hidden">
            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-15 pointer-events-none">
              <IconUserCheck className="w-24 h-24 text-emerald-600" />
            </div>
            <CardHeader className="pb-2 relative z-10">
              <CardDescription>Attendance Today</CardDescription>
              <CardTitle className="text-3xl">{attToday?.present ?? 0}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground relative z-10">Present</CardContent>
          </Card>
          <Card className="border-red-200/80 bg-red-50/70 relative overflow-hidden">
            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-15 pointer-events-none">
              <IconUserX className="w-24 h-24 text-red-600" />
            </div>
            <CardHeader className="pb-2 relative z-10">
              <CardDescription>Attendance Today</CardDescription>
              <CardTitle className="text-3xl">{attToday?.absent ?? 0}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground relative z-10">Absent</CardContent>
          </Card>
          <Card className="border-sky-200/80 bg-sky-50/70 relative overflow-hidden">
            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-15 pointer-events-none">
              <IconClock className="w-24 h-24 text-sky-600" />
            </div>
            <CardHeader className="pb-2 relative z-10">
              <CardDescription>Leaves Today</CardDescription>
              <CardTitle className="text-3xl">{leavesToday?.total ?? 0}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground relative z-10">Approved</CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>
                <span className="flex items-center gap-2"><IconCalendar className="size-5 text-primary" /> Leave Trends</span>
              </CardTitle>
              <CardDescription>{leaveTrends?.year || year}</CardDescription>
            </CardHeader>
            <CardContent className="px-2 pt-2">
              <ChartContainer config={{}} className="aspect-auto h-[280px] w-full">
                <BarChart data={trendData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis allowDecimals={false} width={30} tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                  {trendTypes.map((t, i) => (
                    <Bar
                      key={t}
                      dataKey={t}
                      stackId="a"
                      fill={trendColors[i % trendColors.length]}
                      radius={[6, 6, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
              <IconCalendar className="w-48 h-48 text-primary" />
            </div>
            <CardHeader className="relative z-10">
              <div className="flex items-center justify-between w-full">
                <div>
                  <CardTitle>
                    <span className="flex items-center gap-2"><IconCalendar className="size-5 text-primary" /> Leaves</span>
                  </CardTitle>
                  <CardDescription>Latest pending ({leaveRequests?.items?.length})</CardDescription>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href="/pages/hr/leaves">View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm relative z-10">
              {(leaveRequests?.items || []).length > 0 ? (
                (leaveRequests?.items || []).map(it => (
                  <div key={it.id} className="rounded-md border p-2 bg-background/50 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{it.requestedBy}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(it.requestedOn).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{it.type}</span>
                      <span>
                        {new Date(it.start).toLocaleDateString()} → {new Date(it.end).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-muted-foreground">No pending requests</div>
              )}
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-100 shadow-sm">
            <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
              <IconGift className="w-48 h-48 text-indigo-500" />
            </div>
            <div className="absolute top-4 right-4 opacity-10 pointer-events-none">
              <IconGift className="w-12 h-12 text-indigo-500 rotate-12" />
            </div>
            <CardHeader className="relative z-10">
              <CardTitle className="text-indigo-950">
                <span className="flex items-center gap-2"><IconGift className="size-5 text-indigo-600" /> Upcoming Events</span>
              </CardTitle>
              <CardDescription className="text-indigo-600/80">Next 14 days</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm relative z-10">
              <div>
                <div className="text-indigo-900 font-semibold mb-1">Birthdays</div>
                {(events?.birthdays || []).slice(0, 6).map((b, i) => (
                  <div key={i} className="flex items-center justify-between text-indigo-900">
                    <span>{b.name}</span>
                    <span className="text-indigo-600/80">{b.date}</span>
                  </div>
                ))}
                {(!events?.birthdays || events.birthdays.length === 0) && (
                  <div className="text-indigo-600/60">No upcoming birthdays</div>
                )}
              </div>
              <div>
                <div className="text-indigo-900 font-semibold mb-1">Work Anniversaries</div>
                {(events?.workAnniversaries || []).slice(0, 6).map((a, i) => (
                  <div key={i} className="flex items-center justify-between text-indigo-900">
                    <span>{a.name}</span>
                    <span className="text-indigo-600/80">{a.date}</span>
                  </div>
                ))}
                {(!events?.workAnniversaries || events.workAnniversaries.length === 0) && (
                  <div className="text-indigo-600/60">No upcoming anniversaries</div>
                )}
              </div>
            </CardContent>
          </Card>


        </div>



        {error ? <div className="text-sm text-red-600">{error}</div> : null}
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => {
            setShowFeedbackModal(false);
            setFeedbackSubmitted(false);
            resetFeedback();
          }}
        >
          <div
            className="w-full max-w-2xl my-8 rounded-2xl bg-white p-0 shadow-2xl ring-1 ring-black/5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">Employee Feedback Survey</h2>
              <button
                onClick={() => {
                  setShowFeedbackModal(false);
                  setFeedbackSubmitted(false);
                  resetFeedback();
                }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Close"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {feedbackSubmitted ? (
              <div className="text-center py-8">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="mt-3 text-lg font-medium text-gray-900">Thank You!</h3>
                <p className="mt-2 text-sm text-gray-500">Your feedback has been submitted successfully.</p>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit}>
                <div className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto pr-2 px-6 py-4">
                  {[
                    { id: 'overall', label: 'How would you rate your overall experience at our company?' },
                    { id: 'culture', label: 'How would you rate our company culture?' },
                    { id: 'balance', label: 'How would you rate your work-life balance?' },
                    { id: 'salary', label: 'How satisfied are you with your salary and benefits?' },
                    { id: 'growth', label: 'How would you rate your opportunities for growth and development?' },
                    { id: 'manager', label: 'How would you rate your relationship with your manager?' },
                    { id: 'policies', label: 'How would you rate our company policies and procedures?' },
                    { id: 'recommend', label: 'How likely are you to recommend our company as a great place to work?' },
                  ].map((question) => (
                    <div key={question.id} className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {question.label}
                        <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => handleRatingClick(question.id as keyof FeedbackState, star)}
                            className={`text-2xl transition-transform duration-150 ${Number(feedback[question.id as keyof FeedbackState]) >= star ? 'text-yellow-400 drop-shadow' : 'text-gray-300'} hover:text-yellow-400 hover:scale-110 focus:outline-none`}
                            aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                          >
                            ★
                          </button>
                        ))}
                        <span className="ml-2 text-sm text-gray-500">
                          {Number(feedback[question.id as keyof FeedbackState]) || 0}/5
                        </span>
                      </div>
                    </div>
                  ))}

                  <div>
                    <label htmlFor="comments" className="block text-sm font-medium text-gray-700">
                      Additional Comments
                    </label>
                    <textarea
                      id="comments"
                      name="comments"
                      rows={3}
                      className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={feedback.comments}
                      onChange={handleFeedbackChange}
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t mt-2">
                    <button
                      type="button"
                      onClick={() => setShowFeedbackModal(false)}
                      className="rounded-full border border-gray-300 bg-white py-2 px-5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex justify-center rounded-full border border-transparent bg-gradient-to-r from-blue-600 to-indigo-600 py-2 px-5 text-sm font-semibold text-white shadow-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Success toast */}
      {showFeedbackSuccess && (
        <div
          className="fixed bottom-6 right-6 z-[9999] flex items-start gap-3 rounded-xl border border-green-200 bg-white p-4 shadow-2xl animate-in fade-in zoom-in-95"
          role="status"
          aria-live="polite"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
            <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <div className="font-semibold text-gray-900">Feedback submitted</div>
            <div className="text-sm text-gray-600">Thanks for sharing your feedback.</div>
          </div>
          <button
            onClick={() => setShowFeedbackSuccess(false)}
            className="ml-2 inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100"
            aria-label="Dismiss notification"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
}
