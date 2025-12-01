"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

  const Stars = ({ value }: { value: number }) => (
    <div className="inline-flex items-center" title={`${value}/5`} aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`text-[15px] leading-none ${value >= i ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
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
    return () => { ignore = true; };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) =>
      String(it.id).toLowerCase().includes(q) ||
      String(it.comments || "").toLowerCase().includes(q)
    );
  }, [items, query]);

  return (
    <div className="p-6 space-y-6">
      <Card className="shadow-xl border rounded-lg overflow-hidden">
        <CardContent className="p-0">
          <div
            className="px-5 py-3"
            style={{
              background: 'linear-gradient(90deg, #6E2CFF 0%, #7C3AED 100%)',
              backgroundImage: 'linear-gradient(90deg, lab(38 0.34 -46.26) 0%, lab(55 0.22 -28) 100%)'
            } as any}
          >
            <CardTitle className="text-white tracking-tight">Survey Feedbacks</CardTitle>
            <CardDescription className="text-white/80">All employee feedback submissions</CardDescription>
          </div>
          <div className="p-4 flex flex-wrap items-center justify-between gap-3">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by ID or comment..."
              className="h-9 w-full sm:w-[280px]"
            />
            <Button asChild variant="outline" className="h-9">
              <Link href="/pages/admin">Back to Dashboard</Link>
            </Button>
          </div>
          <div className="px-4 pb-4">
            {error ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
            ) : loading ? (
              <div className="py-10 text-center text-sm text-muted-foreground">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="rounded-md border bg-white p-6 text-center text-sm text-muted-foreground">No feedbacks found.</div>
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <Table className="[&_th]:whitespace-nowrap text-sm">
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="w-[80px]">ID</TableHead>
                      <TableHead>Overall</TableHead>
                      <TableHead>Culture</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Salary</TableHead>
                      <TableHead>Growth</TableHead>
                      <TableHead>Manager</TableHead>
                      <TableHead>Policies</TableHead>
                      <TableHead>Recommend</TableHead>
                      <TableHead className="min-w-[240px]">Comments</TableHead>
                      <TableHead>Submitted</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((it, idx) => (
                      <TableRow key={String(it.id)} className={idx % 2 ? 'bg-muted/10' : ''}>
                        <TableCell className="font-medium">{String(it.id)}</TableCell>
                        <TableCell><Stars value={it.overall} /></TableCell>
                        <TableCell><Stars value={it.culture} /></TableCell>
                        <TableCell><Stars value={it.balance} /></TableCell>
                        <TableCell><Stars value={it.salary} /></TableCell>
                        <TableCell><Stars value={it.growth} /></TableCell>
                        <TableCell><Stars value={it.manager} /></TableCell>
                        <TableCell><Stars value={it.policies} /></TableCell>
                        <TableCell><Stars value={it.recommend} /></TableCell>
                        <TableCell title={it.comments || ""} className="max-w-[360px] truncate">{it.comments || "-"}</TableCell>
                        <TableCell className="whitespace-nowrap">{it.createdAt ? new Date(it.createdAt).toLocaleString() : "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
