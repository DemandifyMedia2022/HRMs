"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { SidebarConfig } from "@/components/sidebar-config"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

export default function EmployeeStateInsurancePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    esi: 'No',
    wage: '',
    esi_limit: 'No',
    employer_esi: 'None',
    employee_esi: 'None',
    negative: 'No',
    physical: 'No',
  })

  const [checkboxes, setCheckboxes] = useState({
    process_overtime: true,
    process_arrear: true,
  })

  useEffect(() => {
    fetchEmployeeInsurance()
  }, [])

  const fetchEmployeeInsurance = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/payroll/employee-insurance", {
        cache: "no-store",
        credentials: 'include'
      })
      const json = await res.json()
      
      if (json.success && json.data) {
        const data = json.data
        setFormData({
          esi: data.esi || 'No',
          wage: data.wage || '',
          esi_limit: data.esi_limit || 'No',
          employer_esi: data.employer_esi || 'None',
          employee_esi: data.employee_esi || 'None',
          negative: data.negative || 'No',
          physical: data.physical || 'No',
        })
      }
    } catch (error) {
      console.error("Error fetching employee insurance:", error)
      toast({
        title: "Error",
        description: "Failed to load employee insurance settings",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleCheckboxChange = (field: string, checked: boolean) => {
    setCheckboxes(prev => ({ ...prev, [field]: checked }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      const res = await fetch("/api/payroll/employee-insurance", {
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
          description: "Employee insurance settings saved successfully",
        })
      } else {
        throw new Error(json.error || "Failed to save")
      }
    } catch (error: any) {
      console.error("Error saving employee insurance:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save employee insurance settings",
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
          <div className="text-center p-8">Loading employee insurance settings...</div>
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
              <CardTitle className="text-xl font-bold text-primary">EMPLOYEE STATE INSURANCE</CardTitle>
              <Button variant="ghost" onClick={() => router.back()}>
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* ESI Applicability */}
              <div>
                <Label className="mb-3 block text-base">Is ESI applicable?</Label>
                <RadioGroup value={formData.esi} onValueChange={(val) => handleInputChange('esi', val)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Yes" id="esi-yes" />
                    <Label htmlFor="esi-yes" className="font-normal">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="No" id="esi-no" />
                    <Label htmlFor="esi-no" className="font-normal">No</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Wage Ceiling */}
              <div>
                <Label>Wage ceiling of ESI contribution <span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  value={formData.wage}
                  onChange={(e) => handleInputChange('wage', e.target.value)}
                  className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                  placeholder="Enter wage ceiling amount"
                />
              </div>

              {/* ESI Limit Processing */}
              <div>
                <Label className="mb-3 block">Do you want to process ESI on ESI limit?</Label>
                <RadioGroup value={formData.esi_limit} onValueChange={(val) => handleInputChange('esi_limit', val)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Yes" id="esi-limit-yes" />
                    <Label htmlFor="esi-limit-yes" className="font-normal">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="No" id="esi-limit-no" />
                    <Label htmlFor="esi-limit-no" className="font-normal">No</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Employer ESI Roundoff */}
              <div>
                <Label className="mb-3 block">Round off employer's ESI contribution on</Label>
                <RadioGroup value={formData.employer_esi} onValueChange={(val) => handleInputChange('employer_esi', val)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="None" id="employer-none" />
                    <Label htmlFor="employer-none" className="font-normal">None</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Nearest" id="employer-nearest" />
                    <Label htmlFor="employer-nearest" className="font-normal">Nearest</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Higher" id="employer-higher" />
                    <Label htmlFor="employer-higher" className="font-normal">Higher</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Employee ESI Roundoff */}
              <div>
                <Label className="mb-3 block">Round off employee ESI contribution on</Label>
                <RadioGroup value={formData.employee_esi} onValueChange={(val) => handleInputChange('employee_esi', val)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="None" id="employee-none" />
                    <Label htmlFor="employee-none" className="font-normal">None</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Nearest" id="employee-nearest" />
                    <Label htmlFor="employee-nearest" className="font-normal">Nearest</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Higher" id="employee-higher" />
                    <Label htmlFor="employee-higher" className="font-normal">Higher</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Negative Arrear Impact */}
              <div>
                <Label className="mb-3 block">Do you want to enable the impact of negative arrear on ESI?</Label>
                <RadioGroup value={formData.negative} onValueChange={(val) => handleInputChange('negative', val)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Yes" id="negative-yes" />
                    <Label htmlFor="negative-yes" className="font-normal">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="No" id="negative-no" />
                    <Label htmlFor="negative-no" className="font-normal">No</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Physical Disability */}
              <div>
                <Label className="mb-3 block">Do you want to apply ESI limit in case of physical disability?</Label>
                <RadioGroup value={formData.physical} onValueChange={(val) => handleInputChange('physical', val)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Yes" id="physical-yes" />
                    <Label htmlFor="physical-yes" className="font-normal">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="No" id="physical-no" />
                    <Label htmlFor="physical-no" className="font-normal">No</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Configuration */}
              <div>
                <h3 className="bg-muted p-3 mb-6 text-lg font-semibold">Configuration</h3>
                <div className="space-y-4">
                  <Label className="mb-3 block">Select whichever is applicable</Label>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="process-overtime" 
                      checked={checkboxes.process_overtime}
                      onCheckedChange={(checked) => handleCheckboxChange('process_overtime', checked as boolean)}
                    />
                    <Label htmlFor="process-overtime" className="font-normal">Process ESI on overtime</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="process-arrear" 
                      checked={checkboxes.process_arrear}
                      onCheckedChange={(checked) => handleCheckboxChange('process_arrear', checked as boolean)}
                    />
                    <Label htmlFor="process-arrear" className="font-normal">Process ESI on arrear</Label>
                  </div>
                </div>
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
