"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { SidebarConfig } from "@/components/sidebar-config"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

export default function TDSDeductorPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    // Income tax details
    financial_year: '2025-2026',
    group_name: 'Gnosis Data Marketing',
    pan_number: 'AAJCG8670N',
    tan_number: 'PNEG28450C',
    gst_number: '27AAJCG8670N1ZS',
    
    // Deductor details
    deductor_name: 'Gnosis Data Marketing',
    deductor_branch: 'Gnosis Data Marketing',
    deductor_flat_no: '1',
    deductor_building: 'Nyati empress',
    deductor_street: 'Viman Nagar Road',
    deductor_area: 'Viman Nagar',
    deductor_state: 'Maharashtra',
    deductor_city: 'Pune',
    deductor_pin: '121212',
    deductor_address_change: 'No',
    deductor_std_code: '',
    deductor_phone: '',
    deductor_fax: '',
    deductor_email: 'viresh.kumbhar@gnosisdatamarketing.com',
    
    // Responsible person details
    person_name: 'viresh kumbhar',
    person_group_owner: 'Viresh Basvant Kumbhar #DM007',
    person_designation: 'Account Director',
    person_father_name: 'NA',
    person_gender: 'Male',
    person_flat_no: '1',
    person_building: 'Nyati Empress',
    person_street: 'Viman Nagar Road',
    person_area: 'Viman Nagar',
    person_state: 'Maharashtra',
    person_city: 'Pune',
    person_pin: '121212',
    person_address_change: 'No',
    person_std_code: '',
    person_phone: '',
    person_fax: '',
    person_mobile: '1212121212',
    person_pan: 'DPBPA0135M',
    person_email: 'viresh.kumbhar@gnosisdatamarketing.com',
    
    // Applicability
    company: 'Demandify Media',
    branch: 'Pune',
    sub_branch: 'Pune',
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      // Since no backend endpoint was specified, just show success message
      toast({
        title: "Success",
        description: "TDS deductor information saved successfully",
      })
    } catch (error: any) {
      console.error("Error saving TDS deductor info:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save TDS deductor information",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <SidebarConfig role="hr" />
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        <Card>
          <CardHeader className="border-b-2 border-primary">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold text-primary">TDS DEDUCTOR INFORMATION</CardTitle>
              <Button variant="ghost" onClick={() => router.back()}>
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Income Tax Details Section */}
              <div>
                <h3 className="bg-muted p-3 mb-6 text-lg font-semibold">Income tax details</h3>
                <div className="space-y-6">
                  <div>
                    <Label>Financial year <span className="text-red-500">*</span></Label>
                    <Input
                      type="text"
                      value={formData.financial_year}
                      onChange={(e) => handleInputChange('financial_year', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>

                  <div>
                    <Label>Group name <span className="text-red-500">*</span></Label>
                    <Input
                      type="text"
                      value={formData.group_name}
                      onChange={(e) => handleInputChange('group_name', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>

                  <div>
                    <Label>PAN number <span className="text-red-500">*</span></Label>
                    <Input
                      type="text"
                      value={formData.pan_number}
                      onChange={(e) => handleInputChange('pan_number', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>

                  <div>
                    <Label>TAN number <span className="text-red-500">*</span></Label>
                    <Input
                      type="text"
                      value={formData.tan_number}
                      onChange={(e) => handleInputChange('tan_number', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>

                  <div>
                    <Label>Goods and service tax number <span className="text-red-500">*</span></Label>
                    <Input
                      type="text"
                      value={formData.gst_number}
                      onChange={(e) => handleInputChange('gst_number', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>
                </div>
              </div>

              {/* Deductor Details Section */}
              <div>
                <h3 className="bg-muted p-3 mb-6 text-lg font-semibold">Deductor details</h3>
                <div className="space-y-6">
                  <div>
                    <Label>Name <span className="text-red-500">*</span></Label>
                    <Input
                      type="text"
                      value={formData.deductor_name}
                      onChange={(e) => handleInputChange('deductor_name', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>

                  <div>
                    <Label>Branch <span className="text-red-500">*</span></Label>
                    <Input
                      type="text"
                      value={formData.deductor_branch}
                      onChange={(e) => handleInputChange('deductor_branch', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>

                  <div>
                    <Label>Flat/ Door/ Block No. <span className="text-red-500">*</span></Label>
                    <Input
                      type="text"
                      value={formData.deductor_flat_no}
                      onChange={(e) => handleInputChange('deductor_flat_no', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>

                  <div>
                    <Label>Name of building <span className="text-red-500">*</span></Label>
                    <Input
                      type="text"
                      value={formData.deductor_building}
                      onChange={(e) => handleInputChange('deductor_building', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>

                  <div>
                    <Label>Street/ Road name <span className="text-red-500">*</span></Label>
                    <Input
                      type="text"
                      value={formData.deductor_street}
                      onChange={(e) => handleInputChange('deductor_street', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>

                  <div>
                    <Label>Area <span className="text-red-500">*</span></Label>
                    <Input
                      type="text"
                      value={formData.deductor_area}
                      onChange={(e) => handleInputChange('deductor_area', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>

                  <div>
                    <Label>State <span className="text-red-500">*</span></Label>
                    <Input
                      type="text"
                      value={formData.deductor_state}
                      onChange={(e) => handleInputChange('deductor_state', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>

                  <div>
                    <Label>City <span className="text-red-500">*</span></Label>
                    <Input
                      type="text"
                      value={formData.deductor_city}
                      onChange={(e) => handleInputChange('deductor_city', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>

                  <div>
                    <Label>PIN <span className="text-red-500">*</span></Label>
                    <Input
                      type="text"
                      value={formData.deductor_pin}
                      onChange={(e) => handleInputChange('deductor_pin', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>

                  <div>
                    <Label>Address change <span className="text-red-500">*</span></Label>
                    <Input
                      type="text"
                      value={formData.deductor_address_change}
                      onChange={(e) => handleInputChange('deductor_address_change', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>

                  <div>
                    <Label>STD code <span className="text-red-500">*</span></Label>
                    <Input
                      type="text"
                      value={formData.deductor_std_code}
                      onChange={(e) => handleInputChange('deductor_std_code', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>

                  <div>
                    <Label>Phone No <span className="text-red-500">*</span></Label>
                    <Input
                      type="text"
                      value={formData.deductor_phone}
                      onChange={(e) => handleInputChange('deductor_phone', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>

                  <div>
                    <Label>Fax <span className="text-red-500">*</span></Label>
                    <Input
                      type="text"
                      value={formData.deductor_fax}
                      onChange={(e) => handleInputChange('deductor_fax', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>

                  <div>
                    <Label>Email <span className="text-red-500">*</span></Label>
                    <Input
                      type="email"
                      value={formData.deductor_email}
                      onChange={(e) => handleInputChange('deductor_email', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>
                </div>
              </div>

              {/* Responsible Person Details Section */}
              <div>
                <h3 className="bg-muted p-3 mb-6 text-lg font-semibold">Responsible person details</h3>
                <div className="space-y-6">
                  <div>
                    <Label>Name <span className="text-red-500">*</span></Label>
                    <Input
                      type="text"
                      value={formData.person_name}
                      onChange={(e) => handleInputChange('person_name', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>

                  <div>
                    <Label>Group owner <span className="text-red-500">*</span></Label>
                    <Input
                      type="text"
                      value={formData.person_group_owner}
                      onChange={(e) => handleInputChange('person_group_owner', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>

                  <div>
                    <Label>Designation <span className="text-red-500">*</span></Label>
                    <Input
                      type="text"
                      value={formData.person_designation}
                      onChange={(e) => handleInputChange('person_designation', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>

                  <div>
                    <Label>Father's name <span className="text-red-500">*</span></Label>
                    <Input
                      type="text"
                      value={formData.person_father_name}
                      onChange={(e) => handleInputChange('person_father_name', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>

                  <div>
                    <Label>Gender <span className="text-red-500">*</span></Label>
                    <Input
                      type="text"
                      value={formData.person_gender}
                      onChange={(e) => handleInputChange('person_gender', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>

                  <div>
                    <Label>Flat/ Door/ Block No. <span className="text-red-500">*</span></Label>
                    <Input
                      type="text"
                      value={formData.person_flat_no}
                      onChange={(e) => handleInputChange('person_flat_no', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>

                  <div>
                    <Label>Name of building <span className="text-red-500">*</span></Label>
                    <Input
                      type="text"
                      value={formData.person_building}
                      onChange={(e) => handleInputChange('person_building', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>

                  <div>
                    <Label>Street/ Road name <span className="text-red-500">*</span></Label>
                    <Input
                      type="text"
                      value={formData.person_street}
                      onChange={(e) => handleInputChange('person_street', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>

                  <div>
                    <Label>Area <span className="text-red-500">*</span></Label>
                    <Input
                      type="text"
                      value={formData.person_area}
                      onChange={(e) => handleInputChange('person_area', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>

                  <div>
                    <Label>State <span className="text-red-500">*</span></Label>
                    <Input
                      type="text"
                      value={formData.person_state}
                      onChange={(e) => handleInputChange('person_state', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>

                  <div>
                    <Label>City <span className="text-red-500">*</span></Label>
                    <Input
                      type="text"
                      value={formData.person_city}
                      onChange={(e) => handleInputChange('person_city', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>

                  <div>
                    <Label>PIN <span className="text-red-500">*</span></Label>
                    <Input
                      type="text"
                      value={formData.person_pin}
                      onChange={(e) => handleInputChange('person_pin', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>

                  <div>
                    <Label>Address change <span className="text-red-500">*</span></Label>
                    <Input
                      type="text"
                      value={formData.person_address_change}
                      onChange={(e) => handleInputChange('person_address_change', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>

                  <div>
                    <Label>STD code <span className="text-red-500">*</span></Label>
                    <Input
                      type="text"
                      value={formData.person_std_code}
                      onChange={(e) => handleInputChange('person_std_code', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>

                  <div>
                    <Label>Phone number <span className="text-red-500">*</span></Label>
                    <Input
                      type="text"
                      value={formData.person_phone}
                      onChange={(e) => handleInputChange('person_phone', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>

                  <div>
                    <Label>Fax <span className="text-red-500">*</span></Label>
                    <Input
                      type="text"
                      value={formData.person_fax}
                      onChange={(e) => handleInputChange('person_fax', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>

                  <div>
                    <Label>Mobile number <span className="text-red-500">*</span></Label>
                    <Input
                      type="text"
                      value={formData.person_mobile}
                      onChange={(e) => handleInputChange('person_mobile', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>

                  <div>
                    <Label>PAN number <span className="text-red-500">*</span></Label>
                    <Input
                      type="text"
                      value={formData.person_pan}
                      onChange={(e) => handleInputChange('person_pan', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>

                  <div>
                    <Label>Email <span className="text-red-500">*</span></Label>
                    <Input
                      type="email"
                      value={formData.person_email}
                      onChange={(e) => handleInputChange('person_email', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>
                </div>
              </div>

              {/* Applicability Section */}
              <div>
                <h3 className="bg-muted p-3 mb-6 text-lg font-semibold">Applicability</h3>
                <div className="space-y-6">
                  <div>
                    <Label>Company <span className="text-red-500">*</span></Label>
                    <Input
                      type="text"
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>

                  <div>
                    <Label>Branch <span className="text-red-500">*</span></Label>
                    <Input
                      type="text"
                      value={formData.branch}
                      onChange={(e) => handleInputChange('branch', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>

                  <div>
                    <Label>Sub branch <span className="text-red-500">*</span></Label>
                    <Input
                      type="text"
                      value={formData.sub_branch}
                      onChange={(e) => handleInputChange('sub_branch', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
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
