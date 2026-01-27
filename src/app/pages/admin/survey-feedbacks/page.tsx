"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Star, MessageSquare, TrendingUp, Users, Calendar, Filter } from "lucide-react";
import { SidebarConfig } from "@/components/sidebar-config";

type Feedback = {
  id: number | string;
  overall: number;
  culture: number;
  balance: number;
  salary: number;
  growth: number;
  manager: number;
  policies: number;
  recommend: number;
  comments: string | null;
  createdAt?: string | null;
};

export default function AdminSurveyFeedbacksPage() {
  const [items, setItems] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [query, setQuery] = useState("");

  const Stars = ({ value }: { value: number }) => {
    const fullStars = Math.floor(value);
    const hasHalfStar = value % 1 >= 0.5;
    return (
      <div className="inline-flex items-center gap-0.5" title={`${value.toFixed(1)}/5`} aria-label={`${value.toFixed(1)} out of 5`}>
        {[1, 2, 3, 4, 5].map((i) => {
          if (i <= fullStars) {
            return <Star key={i} className="h-4 w-4 text-yellow-500 fill-yellow-500" />;
          } else if (i === fullStars + 1 && hasHalfStar) {
            return (
              <div key={i} className="relative h-4 w-4 inline-block">
                <Star className="h-4 w-4 text-gray-300 absolute inset-0" />
                <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                </div>
              </div>
            );
          } else {
            return <Star key={i} className="h-4 w-4 text-gray-300" />;
          }
        })}
        <span className="ml-1 text-xs text-muted-foreground font-medium">{value.toFixed(1)}</span>
      </div>
    );
  };

  useEffect(() => {
    let ignore = false;
    let timeoutId: NodeJS.Timeout;
    
    (async () => {
      try {
        setLoading(true);
        setError("");
        
        // Add timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          if (!ignore) {
            setError("Request timeout. Please try again.");
            setLoading(false);
          }
        }, 30000); // 30 second timeout
        
        const res = await fetch("/api/feedback", { 
          cache: "no-store",
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        clearTimeout(timeoutId);
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const json = await res.json();
        
        if (!ignore) {
          if (json?.success && json?.data) {
            setItems(json.data as Feedback[]);
          } else if (json?.data) {
            setItems(json.data as Feedback[]);
          } else {
            setError(json?.error || "No data received");
            setItems([]);
          }
        }
      } catch (e: any) {
        clearTimeout(timeoutId);
        if (!ignore) {
          console.error("Error loading feedbacks:", e);
          setError(e?.message || "Failed to load feedbacks. Please check your connection and try again.");
          setItems([]);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    
    return () => { 
      ignore = true;
      clearTimeout(timeoutId);
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) =>
      String(it.id).toLowerCase().includes(q) ||
      String(it.comments || "").toLowerCase().includes(q)
    );
  }, [items, query]);

  const stats = useMemo(() => {
    if (items.length === 0) return { avgOverall: 0, avgRecommend: 0, total: 0 };
    const avgOverall = items.reduce((sum, it) => sum + it.overall, 0) / items.length;
    const avgRecommend = items.reduce((sum, it) => sum + it.recommend, 0) / items.length;
    return { avgOverall: avgOverall.toFixed(1), avgRecommend: avgRecommend.toFixed(1), total: items.length };
  }, [items]);

  return (
    <>
      <SidebarConfig role="admin" />
      <div className="min-h-screen p-4 md:p-6 space-y-6 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Survey Feedbacks</h1>
              <p className="text-muted-foreground mt-1">View and analyze employee feedback submissions</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Total Responses</p>
                    <p className="text-3xl font-bold text-purple-900 dark:text-purple-100 mt-2">{stats.total}</p>
                  </div>
                  <div className="h-14 w-14 rounded-full bg-purple-200 dark:bg-purple-800 flex items-center justify-center">
                    <Users className="h-7 w-7 text-purple-600 dark:text-purple-300" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">Avg Overall Rating</p>
                    <p className="text-3xl font-bold text-green-900 dark:text-green-100 mt-2">{stats.avgOverall}/5</p>
                  </div>
                  <div className="h-14 w-14 rounded-full bg-green-200 dark:bg-green-800 flex items-center justify-center">
                    <Star className="h-7 w-7 text-green-600 dark:text-green-300 fill-green-600 dark:fill-green-300" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Avg Recommendation</p>
                    <p className="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-2">{stats.avgRecommend}/5</p>
                  </div>
                  <div className="h-14 w-14 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center">
                    <TrendingUp className="h-7 w-7 text-blue-600 dark:text-blue-300" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-lg border-0">
            <CardHeader className="border-b">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-xl">Feedback Responses</CardTitle>
                  <CardDescription className="mt-1">View and analyze employee feedback</CardDescription>
                </div>
                <Badge variant="secondary" className="w-fit text-sm px-3 py-1">
                  {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="mb-6">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by comment or ID..."
                    className="pl-10 h-10"
                  />
                </div>
              </div>

              {error ? (
                <div className="rounded-lg border border-destructive bg-destructive/10 p-6 text-center">
                  <p className="text-sm text-destructive font-medium">{error}</p>
                </div>
              ) : loading ? (
                <div className="py-16 text-center">
                  <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-muted border-t-primary"></div>
                  <p className="mt-4 text-sm text-muted-foreground">Loading feedback...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="rounded-lg border border-dashed p-16 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">No feedbacks found</p>
                  <p className="text-xs text-muted-foreground mt-1">Try adjusting your search criteria</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold min-w-[120px]">Overall</TableHead>
                        <TableHead className="font-semibold min-w-[100px]">Culture</TableHead>
                        <TableHead className="font-semibold min-w-[100px]">Balance</TableHead>
                        <TableHead className="font-semibold min-w-[100px]">Salary</TableHead>
                        <TableHead className="font-semibold min-w-[100px]">Growth</TableHead>
                        <TableHead className="font-semibold min-w-[100px]">Manager</TableHead>
                        <TableHead className="font-semibold min-w-[100px]">Policies</TableHead>
                        <TableHead className="font-semibold min-w-[120px]">Recommend</TableHead>
                        <TableHead className="font-semibold min-w-[250px]">Comments</TableHead>
                        <TableHead className="font-semibold min-w-[120px]">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((it, idx) => (
                        <TableRow key={String(it.id)} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                          <TableCell className="py-4">
                            <Stars value={it.overall} />
                          </TableCell>
                          <TableCell className="py-4">
                            <Stars value={it.culture} />
                          </TableCell>
                          <TableCell className="py-4">
                            <Stars value={it.balance} />
                          </TableCell>
                          <TableCell className="py-4">
                            <Stars value={it.salary} />
                          </TableCell>
                          <TableCell className="py-4">
                            <Stars value={it.growth} />
                          </TableCell>
                          <TableCell className="py-4">
                            <Stars value={it.manager} />
                          </TableCell>
                          <TableCell className="py-4">
                            <Stars value={it.policies} />
                          </TableCell>
                          <TableCell className="py-4">
                            <Stars value={it.recommend} />
                          </TableCell>
                          <TableCell className="max-w-[300px] py-4">
                            {it.comments ? (
                              <div className="group relative">
                                <p className="text-sm line-clamp-2 pr-4" title={it.comments}>
                                  {it.comments}
                                </p>
                                {it.comments.length > 50 && (
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-background opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">No comment</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap py-4">
                            {it.createdAt ? (
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3 w-3" />
                                <span>{new Date(it.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
