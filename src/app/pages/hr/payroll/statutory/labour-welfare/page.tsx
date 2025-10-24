"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { SidebarConfig } from "@/components/sidebar-config"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

export default function LabourWelfareFundPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    LWF: 'No',
  })

  useEffect(() => {
    fetchLabourWelfare()
  }, [])

  const fetchLabourWelfare = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/payroll/labour-welfare", {
        cache: "no-store",
        credentials: 'include'
      })
      const json = await res.json()
      
      if (json.success && json.data) {
        const data = json.data
        setFormData({
          LWF: data.LWF || 'No',
        })
      }
    } catch (error) {
      console.error("Error fetching labour welfare fund:", error)
      toast({
        title: "Error",
        description: "Failed to load labour welfare fund settings",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      const res = await fetch("/api/payroll/labour-welfare", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      })

      const json = await res.json()
      if (json.success) {
        toast({
          title: "Success",
          description: "Labour welfare fund settings saved successfully",
        })
      } else {
        throw new Error(json.error || "Failed to save")
      }
    } catch (error: any) {
      console.error("Error saving labour welfare fund:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save labour welfare fund settings",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <>
        <SidebarConfig role="hr" />
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
          <div className="text-center p-8">Loading labour welfare fund settings...</div>
        </div>
      </>
    )
  }

  return (
    <>
      <SidebarConfig role="hr" />
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        <Card>
          <CardHeader className="border-b-2 border-primary">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold text-primary">LABOUR WELFARE FUND</CardTitle>
              <Button variant="ghost" onClick={() => router.back()}>
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* LWF Applicability */}
              <div>
                <Label className="mb-3 block text-base">Is LWF applicable?</Label>
                <RadioGroup value={formData.LWF} onValueChange={(val) => handleInputChange('LWF', val)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Yes" id="lwf-yes" />
                    <Label htmlFor="lwf-yes" className="font-normal">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="No" id="lwf-no" />
                    <Label htmlFor="lwf-no" className="font-normal">No</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex justify-center pt-6">
                <Button type="submit" className="w-48" disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
