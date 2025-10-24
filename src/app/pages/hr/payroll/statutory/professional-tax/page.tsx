"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { SidebarConfig } from "@/components/sidebar-config"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

export default function ProfessionalTaxPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    professional_tax: 'No',
    separate: 'No',
    disabled: 'No',
    exemption: 'No',
    exemption_limit: '',
  })

  useEffect(() => {
    fetchProfessionalTax()
  }, [])

  const fetchProfessionalTax = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/payroll/professional-tax", {
        cache: "no-store",
        credentials: 'include'
      })
      const json = await res.json()
      
      if (json.success && json.data) {
        const data = json.data
        setFormData({
          professional_tax: data.professional_tax || 'No',
          separate: data.separate || 'No',
          disabled: data.disabled || 'No',
          exemption: data.exemption || 'No',
          exemption_limit: data.exemption_limit || '',
        })
      }
    } catch (error) {
      console.error("Error fetching professional tax:", error)
      toast({
        title: "Error",
        description: "Failed to load professional tax settings",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setConfirmOpen(true)
  }

  const onConfirmSave = async () => {
    try {
      setSaving(true)
      const res = await fetch("/api/payroll/professional-tax", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(formData),
      })
      const json = await res.json()
      if (json.success) {
        toast({ title: "Saved", description: "Professional tax settings saved successfully" })
        setConfirmOpen(false)
      } else {
        throw new Error(json.error || "Failed to save")
      }
    } catch (error: any) {
      console.error("Error saving professional tax:", error)
      toast({ title: "Error", description: error.message || "Failed to save professional tax settings", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <>
        <SidebarConfig role="hr" />
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
          <div className="text-center p-8">Loading professional tax settings...</div>
        </div>
      </>
    )
  }

  return (
    <>
      <SidebarConfig role="hr" />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Professional Tax</h1>
            <p className="text-muted-foreground">Configure PT applicability, exemptions and limits</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <span onClick={() => router.back()}>Back</span>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Settings</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Professional Tax Applicability */}
              <div>
                <Label className="mb-3 block text-base">Do you want to apply professional tax settings?</Label>
                <RadioGroup value={formData.professional_tax} onValueChange={(val) => handleInputChange('professional_tax', val)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Yes" id="pt-yes" />
                    <Label htmlFor="pt-yes" className="font-normal">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="No" id="pt-no" />
                    <Label htmlFor="pt-no" className="font-normal">No</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Separate Calculation for Arrear */}
              <div>
                <Label className="mb-3 block text-base">Do you want to calculate professional tax separately for arrear?</Label>
                <RadioGroup value={formData.separate} onValueChange={(val) => handleInputChange('separate', val)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Yes" id="separate-yes" />
                    <Label htmlFor="separate-yes" className="font-normal">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="No" id="separate-no" />
                    <Label htmlFor="separate-no" className="font-normal">No</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* PT Exemption for Physically Disabled */}
              <div>
                <Label className="mb-3 block text-base">Do you want to process PT exemption for physically disabled employees?</Label>
                <RadioGroup value={formData.disabled} onValueChange={(val) => handleInputChange('disabled', val)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Yes" id="disabled-yes" />
                    <Label htmlFor="disabled-yes" className="font-normal">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="No" id="disabled-no" />
                    <Label htmlFor="disabled-no" className="font-normal">No</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* State PT Exemption for Senior Citizens */}
              <div>
                <Label className="mb-3 block text-base">Do you want to enable state PT exemption for senior citizens?</Label>
                <RadioGroup value={formData.exemption} onValueChange={(val) => handleInputChange('exemption', val)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Yes" id="exemption-yes" />
                    <Label htmlFor="exemption-yes" className="font-normal">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="No" id="exemption-no" />
                    <Label htmlFor="exemption-no" className="font-normal">No</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Exemption Limit */}
              <div>
                <Label>Exemption limit <span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  value={formData.exemption_limit}
                  onChange={(e) => handleInputChange('exemption_limit', e.target.value)}
                  className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                  placeholder="Enter exemption limit"
                />
              </div>

              <div className="flex justify-center pt-6">
                <Button type="submit" className="w-48" disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Save Professional Tax settings?</AlertDialogTitle>
              <AlertDialogDescription>
                This will update professional tax settings for payroll calculations.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onConfirmSave} disabled={saving}>Confirm</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  )
}
