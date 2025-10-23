"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle2, UploadCloud, User, Building2, FileText, Info, ArrowLeft } from "lucide-react"
import { SidebarConfig } from "@/components/sidebar-config"

export default function RaiseComplaintPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [department, setDepartment] = useState("")
  const [complaintType, setComplaintType] = useState("")
  const [technicalSubType, setTechnicalSubType] = useState("")
  const [reason, setReason] = useState("")
  const [attachment, setAttachment] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Get user info from session/auth
  useEffect(() => {
    // Fetch current user info
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me")
        if (res.ok) {
          const data = await res.json()
          if (data) {
            setName(data.name || "")
            setDepartment(data.department || "")
          }
        }
      } catch (err) {
        console.error("Failed to fetch user:", err)
      }
    }
    fetchUser()
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const formData = new FormData()
      formData.append("name", name)
      formData.append("department", department)
      formData.append("Complaint_Type", complaintType)
      formData.append("Technical_SubType", technicalSubType)
      formData.append("Reson", reason)
      formData.append("added_by_user", name)
      
      if (attachment) {
        formData.append("Attachment", attachment)
      }

      const res = await fetch("/api/complaints", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error || "Failed to submit complaint")
      }

      setSuccess("Complaint raised successfully!")
      // Reset form
      setComplaintType("")
      setTechnicalSubType("")
      setReason("")
      setAttachment(null)

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push("/pages/user")
        router.refresh()
      }, 2000)
    } catch (err: any) {
      setError(err?.message || "Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
    <SidebarConfig role="admin" />
    <div className="p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-3">
              
              Raise a Complaint
            </h1>
            <p className="text-sm text-muted-foreground">Submit issues directly to the concerned department</p>
          </div>
          <Badge variant="secondary" className="text-sm px-4 py-2">Employee Portal</Badge>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex items-start gap-3 pt-4">
              <AlertCircle className="w-5 h-5 text-red-600 mt-1" />
              <div>
                <p className="text-sm font-medium text-red-800">{error}</p>
                <p className="text-xs text-red-600">Please verify the details and try again.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {success && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="flex items-start gap-3 pt-4">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-1" />
              <div>
                <p className="text-sm font-medium text-green-800">{success}</p>
                <p className="text-xs text-green-600">You will be redirected to your dashboard shortly.</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              Complaint Details
            </CardTitle>
            <CardDescription>Please verify your information before submitting the ticket.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    Name
                  </Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    readOnly
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    Department
                  </Label>
                  <Input
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    readOnly
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Complaint Type</Label>
                <Select
                  value={complaintType}
                  onValueChange={(value) => {
                    setComplaintType(value)
                    if (value !== "Technical") {
                      setTechnicalSubType("")
                    }
                  }}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select complaint type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HRMs">HRMs</SelectItem>
                    <SelectItem value="HariDialer">HariDialer</SelectItem>
                    <SelectItem value="Technical">Technical</SelectItem>
                    <SelectItem value="HR-related">HR-related</SelectItem>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {complaintType === "Technical" && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Technical Sub-Type</Label>
                  <Select
                    value={technicalSubType}
                    onValueChange={(value) => setTechnicalSubType(value)}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select sub-type (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Hardware-Related">Hardware-Related</SelectItem>
                      <SelectItem value="Software-Related">Software-Related</SelectItem>
                      <SelectItem value="Onboarding">Onboarding</SelectItem>
                      <SelectItem value="OFF-boarding">OFF-boarding</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-sm font-medium">Reason / Description</Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Please describe your complaint in detail..."
                  className="min-h-[150px]"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Attach Snapshot (Optional)</Label>
                <div className="border-2 border-dashed border-muted rounded-xl p-6 bg-background/50 hover:border-primary/60 transition-colors">
                  <input
                    type="file"
                    id="attachment"
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          setError("File size must be less than 5MB")
                          e.target.value = ""
                          return
                        }
                        setAttachment(file)
                        setError(null)
                      }
                    }}
                  />
                  <Label
                    htmlFor="attachment"
                    className="flex flex-col items-center justify-center gap-2 cursor-pointer"
                  >
                    <UploadCloud className="w-10 h-10 text-primary" />
                    <span className="text-sm text-gray-700 font-medium">
                      {attachment ? attachment.name : "Click to upload or drag and drop"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      PNG, JPG, PDF, DOC (max 5MB)
                    </span>
                  </Label>
                  {attachment && (
                    <div className="flex justify-center mt-3">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => {
                          setAttachment(null)
                          const input = document.getElementById("attachment") as HTMLInputElement
                          if (input) input.value = ""
                        }}
                      >
                        Remove file
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-4">
                <Button type="submit" disabled={submitting} className="min-w-[180px]">
                  {submitting ? "Submitting..." : "Submit Complaint"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/pages/user")}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-primary text-lg flex items-center gap-2">
              <Info className="w-5 h-5" />
              Important Information
            </CardTitle>
            <CardDescription>Keep the following in mind while raising your ticket.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-primary/80 space-y-2 list-disc list-inside">
              <li>Your complaint will be forwarded to the relevant department.</li>
              <li>You will receive an email confirmation once submitted.</li>
              <li>Status updates will be sent to your registered email.</li>
              <li>For urgent matters, please contact your supervisor directly.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  )
}