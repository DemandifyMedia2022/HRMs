"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Star, MessageSquare, TrendingUp, Users } from "lucide-react";

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

export default function SurveyFeedbacksPage() {
  const [items, setItems] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [query, setQuery] = useState("");

  const Stars = ({ value }: { value: number }) => (
    <div className="inline-flex items-center gap-0.5" title={`${value}/5`} aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star 
          key={i} 
          className={`h-4 w-4 ${value >= i ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
        />
      ))}
    </div>
  );

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await fetch("/api/feedback", { cache: "no-store" });
        const json = await res.json();
        if (!ignore) {
          if (res.ok && json?.data) setItems(json.data as Feedback[]);
          else setError(json?.error || "Failed to load feedbacks");
        }
      } catch (e: any) {
        if (!ignore) setError(e?.message || "Failed to load feedbacks");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Survey Feedbacks</h1>
          <p className="text-muted-foreground mt-1">All employee feedback submissions</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/pages/hr">Back to Dashboard</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Total Responses</p>
                <p className="text-3xl font-bold text-purple-900 mt-2">{stats.total}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-200 flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Avg Overall Rating</p>
                <p className="text-3xl font-bold text-green-900 mt-2">{stats.avgOverall}/5</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-200 flex items-center justify-center">
                <Star className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Avg Recommendation</p>
                <p className="text-3xl font-bold text-blue-900 mt-2">{stats.avgRecommend}/5</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-200 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Feedback Responses</CardTitle>
              <CardDescription>View and analyze employee feedback</CardDescription>
            </div>
            <Badge variant="secondary">{filtered.length} {filtered.length === 1 ? 'result' : 'results'}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by comment..."
                className="pl-10 h-9"
              />
            </div>
          </div>

          {error ? (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-center">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          ) : loading ? (
            <div className="py-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-muted border-t-primary"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed p-12 text-center">
              <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No feedbacks found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Overall</TableHead>
                      <TableHead>Culture</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Salary</TableHead>
                      <TableHead>Growth</TableHead>
                      <TableHead>Manager</TableHead>
                      <TableHead>Policies</TableHead>
                      <TableHead>Recommend</TableHead>
                      <TableHead>Comments</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((it) => (
                      <TableRow key={String(it.id)}>
                        <TableCell><Stars value={it.overall} /></TableCell>
                        <TableCell><Stars value={it.culture} /></TableCell>
                        <TableCell><Stars value={it.balance} /></TableCell>
                        <TableCell><Stars value={it.salary} /></TableCell>
                        <TableCell><Stars value={it.growth} /></TableCell>
                        <TableCell><Stars value={it.manager} /></TableCell>
                        <TableCell><Stars value={it.policies} /></TableCell>
                        <TableCell><Stars value={it.recommend} /></TableCell>
                        <TableCell className="max-w-[300px]">
                          {it.comments ? (
                            <p className="text-sm line-clamp-2" title={it.comments}>{it.comments}</p>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">No comment</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {it.createdAt ? new Date(it.createdAt).toLocaleDateString() : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
