"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Star, CheckCircle2, AlertCircle, ArrowLeft, ExternalLink } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const metrics: { key: keyof typeof form; label: string; description: string }[] = [
    { key: "overall", label: "Overall Satisfaction", description: "Your general experience with the company" },
    { key: "culture", label: "Company Culture", description: "Work environment and team dynamics" },
    { key: "balance", label: "Work-Life Balance", description: "Balance between work and personal life" },
    { key: "salary", label: "Compensation", description: "Salary and benefits package" },
    { key: "growth", label: "Career Growth", description: "Learning and advancement opportunities" },
    { key: "manager", label: "Management Support", description: "Leadership and guidance quality" },
    { key: "policies", label: "HR & Policies", description: "Company policies and HR effectiveness" },
    { key: "recommend", label: "Recommendation", description: "Likelihood to recommend to others" },
  ];

  const completionPercentage = useMemo(() => {
    const answered = metrics.filter(m => Number(form[m.key]) > 0).length;
    return Math.round((answered / metrics.length) * 100);
  }, [form, metrics]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      for (const k of [
        "overall", "culture", "balance", "salary", "growth", "manager", "policies", "recommend"
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
      setShowSuccessDialog(true);
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Employee Feedback Survey</h1>
          <p className="text-muted-foreground mt-1">Your honest feedback helps us improve</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/pages/user")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Survey Progress</CardTitle>
              <CardDescription>Complete all questions to submit</CardDescription>
            </div>
            <Badge variant={completionPercentage === 100 ? "default" : "secondary"}>
              {completionPercentage}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={completionPercentage} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {completionPercentage === 100 ? "All questions answered! Ready to submit." : `${metrics.filter(m => Number(form[m.key]) > 0).length} of ${metrics.length} questions answered`}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rate Your Experience</CardTitle>
          <CardDescription>1 = Poor, 2 = Fair, 3 = Good, 4 = Very Good, 5 = Excellent</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
              {metrics.map(({ key, label, description }, idx) => {
                const isAnswered = Number(form[key]) > 0;
                return (
                  <div 
                    key={key} 
                    className={`space-y-3 rounded-lg border p-4 transition-colors ${
                      isAnswered ? 'border-primary/50 bg-primary/5' : 'border-border'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <Label className="text-sm font-medium">
                          {idx + 1}. {label}
                          <span className="text-destructive ml-1">*</span>
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">{description}</p>
                      </div>
                      {isAnswered && (
                        <Badge variant="secondary" className="text-xs">
                          {form[key]}/5
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((v) => (
                        <button
                          key={v}
                          type="button"
                          aria-label={`${label} ${v} star`}
                          onClick={() => setForm((f) => ({ ...f, [key]: v }))}
                          className="p-1.5 rounded hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <Star
                            className={`h-6 w-6 transition-colors ${
                              v <= Number(form[key])
                                ? "text-yellow-500 fill-yellow-500"
                                : "text-muted-foreground/40"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}

              <Separator />

              <div className="space-y-2">
                <Label className="text-sm font-medium">Additional Comments (Optional)</Label>
                <Textarea
                  value={form.comments}
                  onChange={(e) => setForm({ ...form, comments: e.target.value })}
                  placeholder="Share any additional thoughts or suggestions..."
                  className="min-h-24 resize-none"
                  rows={4}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {success && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.push("/pages/user")}
                  size="sm"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={submitting || completionPercentage < 100} 
                  size="sm"
                >
                  {submitting ? "Submitting..." : "Submit Feedback"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <DialogTitle className="text-center text-xl">Thank You for Your Feedback!</DialogTitle>
            <DialogDescription className="text-center">
              Your response has been submitted successfully. We appreciate you taking the time to share your thoughts.
            </DialogDescription>
          </DialogHeader>
          
          <Separator className="my-4" />
          
          <div className="space-y-4">
            <p className="text-sm font-medium text-center">Also review us on:</p>
            <div className="grid grid-cols-3 gap-3">
              <a
                href="https://www.ambitionbox.com/overview/demandify-media-overview"
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
              >
                <div className="h-10 w-10 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 48 48" fill="#3b82f6">
                    <path fill="none" stroke="#3b82f6" strokeLinecap="round" strokeLinejoin="round" d="M5.38 13.25L24 2.5l18.62 10.75v21.5L24 45.5L5.38 34.75l.002.002L24 24V13.25L5.38 24z"/>
                    <path fill="none" stroke="#3b82f6" strokeLinecap="round" strokeLinejoin="round" d="M24 2.5V24l18.618 10.752"/>
                  </svg>
                </div>
                <span className="text-xs font-medium text-center">AmbitionBox</span>
              </a>
              
              <a
                href="https://www.glassdoor.co.in/Reviews/Demandify-Media-Pune-Reviews-EI_IE7737262.0,15_IL.16,20_IM1072.htm"
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
              >
                <div className="h-10 w-10 flex items-center justify-center">
                  <img src="/Glassdoor.jpg" alt="Glassdoor" className="h-10 w-10 object-contain" />
                </div>
                <span className="text-xs font-medium text-center">Glassdoor</span>
              </a>
              
              <a
                href="https://www.linkedin.com/company/demandify-media/posts/?feedView=all"
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-gray-200 hover:border-blue-600 hover:bg-blue-50 transition-all group"
              >
                <div className="h-10 w-10 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" className="h-10 w-10">
                    <path fill="#0076b2" d="M116 3H12a8.91 8.91 0 00-9 8.8v104.42a8.91 8.91 0 009 8.78h104a8.93 8.93 0 009-8.81V11.77A8.93 8.93 0 00116 3z"/>
                    <path fill="#fff" d="M21.06 48.73h18.11V107H21.06zm9.06-29a10.5 10.5 0 11-10.5 10.49 10.5 10.5 0 0110.5-10.49M50.53 48.73h17.36v8h.24c2.42-4.58 8.32-9.41 17.13-9.41C103.6 47.28 107 59.35 107 75v32H88.89V78.65c0-6.75-.12-15.44-9.41-15.44s-10.87 7.36-10.87 15V107H50.53z"/>
                  </svg>
                </div>
                <span className="text-xs font-medium text-center">LinkedIn</span>
              </a>
            </div>
          </div>
          
          <div className="flex gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowSuccessDialog(false);
                router.push("/pages/user");
              }}
              className="flex-1"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
