"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function UserSurveyFormPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    overall: 0,
    culture: 0,
    balance: 0,
    salary: 0,
    growth: 0,
    manager: 0,
    policies: 0,
    recommend: 0,
    comments: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const metrics: { key: keyof typeof form; label: string }[] = [
    { key: "overall", label: "How satisfied are you with the company overall?" },
    { key: "culture", label: "How would you describe the company's culture?" },
    { key: "balance", label: "How satisfied are you with your work-life balance?" },
    { key: "salary", label: "How fair do you find your salary and overall compensation?" },
    { key: "growth", label: "How would you rate your career growth and learning opportunities?" },
    { key: "manager", label: "How supportive is your manager or supervisor?" },
    { key: "policies", label: "How satisfied are you with company policies and HR support?" },
    { key: "recommend", label: "How likely are you to recommend this company to others?" },
  ];

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      for (const k of [
        "overall","culture","balance","salary","growth","manager","policies","recommend"
      ] as (keyof typeof form)[]) {
        if (!form[k]) {
          setSubmitting(false);
          setError("Please answer all rating questions.");
          return;
        }
      }
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || data?.success === false) {
        throw new Error(data?.error || data?.details || "Failed to submit");
      }
      setSuccess("Feedback submitted successfully.");
      setTimeout(() => router.push("/pages/user"), 800);
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="px-3 py-4 md:py-6 mx-auto max-w-3xl w-full">
      <Card className="shadow-xl border rounded-lg">
        <CardContent className="p-0">
          <div
            className="rounded-t-lg px-5 py-3"
            style={{
              background: 'linear-gradient(90deg, #6E2CFF 0%, #7C3AED 100%)',
              backgroundImage:
                'linear-gradient(90deg, lab(38 0.34 -46.26) 0%, lab(55 0.22 -28) 100%)'
            } as any}
          >
            <CardTitle className="text-white font-semibold tracking-tight">Employee Feedback Survey</CardTitle>
          </div>
          <div className="pt-4 px-4 pb-4">
            <p className="text-sm text-muted-foreground mb-4">Please rate each statement. <span className="font-medium">1 = Poor</span>, <span className="font-medium">5 = Excellent</span>.</p>
            <form onSubmit={onSubmit} className="space-y-6">
              {metrics.map(({ key, label }, idx) => (
                <div key={key} className="space-y-3 rounded-md border bg-muted/10 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <Label className="text-[0.95rem] font-medium leading-6">
                      <span className="mr-2 text-muted-foreground">{idx + 1}.</span>
                      {label}
                      <span className="text-destructive ml-1">*</span>
                    </Label>
                    {Number(form[key]) > 0 && (
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{Number(form[key])}/5</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <button
                        key={v}
                        type="button"
                        aria-label={`${label} ${v} star`}
                        onClick={() => setForm((f) => ({ ...f, [key]: v }))}
                        className="p-2 rounded transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                      >
                        <Star
                          className={
                            v <= Number(form[key])
                              ? "text-yellow-500 fill-yellow-500 drop-shadow"
                              : "text-muted-foreground"
                          }
                          size={26}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-xs text-muted-foreground hidden sm:inline">Tap a star to set your rating</span>
                  </div>
                </div>
              ))}

              <div className="space-y-2">
                <Label className="text-sm font-medium">Additional Comments</Label>
                <Textarea
                  value={form.comments}
                  onChange={(e) => setForm({ ...form, comments: e.target.value })}
                  placeholder="Share your feedback or suggestions..."
                  className="min-h-28"
                />
              </div>

              {error && <p className="text-red-600 text-sm">{error}</p>}
              {success && <p className="text-green-600 text-sm">{success}</p>}

              <Separator />
              <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
                <Button type="submit" disabled={submitting} className="w-full sm:w-auto self-stretch sm:self-auto">
                  {submitting ? "Submitting..." : "Submit Feedback"}
                </Button>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
