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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

export default function ProvidentFundPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    hra_calc: 'No',
    pf_contribution: '',
    pf: 'Actual earning for all employees',
    employee_contribution: '',
    admin_charge_basis: 'PF wages',
    admin: 'Employee contribution',
    gross: 'Gross Rate',
    pension: '',
    wage_limit: '',
    process: 'Actual earnings',
    contribution_limit: '',
    charges_rate: '',
    admin_charge: '',
    edli_contribution: '',
    edli_rate: '',
    edli_charge: '',
    fund: 'No',
    vpf: 'PF gross',
    perquisite_rate: '',
    exemption_limit: '',
  })

  const [checkboxes, setCheckboxes] = useState({
    prorate_pf: true,
    prorate_limit: false,
    process_arrears: true,
    show_zero: false,
    provision_admin: false,
  })

  useEffect(() => {
    fetchProvidentFund()
  }, [])

  const fetchProvidentFund = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/payroll/provident-fund", {
        cache: "no-store",
        credentials: 'include'
      })
      const json = await res.json()
      
      if (json.success && json.data) {
        const data = json.data
        setFormData({
          hra_calc: data.hra_calc || 'No',
          pf_contribution: data.pf_contribution || '',
          pf: data.pf || 'Actual earning for all employees',
          employee_contribution: data.employee_contribution || '',
          admin_charge_basis: data.admin_charge_basis || 'PF wages',
          admin: data.admin || 'Employee contribution',
          gross: data.gross || 'Gross Rate',
          pension: data.pension?.toString() || '',
          wage_limit: data.wage_limit || '',
          process: data.process || 'Actual earnings',
          contribution_limit: data.contribution_limit || '',
          charges_rate: data.charges_rate?.toString() || '',
          admin_charge: data.admin_charge || '',
          edli_contribution: data.edli_contribution?.toString() || '',
          edli_rate: data.edli_rate || '',
          edli_charge: data.edli_charge || '',
          fund: data.fund || 'No',
          vpf: data.vpf || 'PF gross',
          perquisite_rate: data.perquisite_rate?.toString() || '',
          exemption_limit: data.exemption_limit || '',
        })
      }
    } catch (error) {
      console.error("Error fetching provident fund:", error)
      toast({
        title: "Error",
        description: "Failed to load provident fund settings",
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setConfirmOpen(true)
  }

  const onConfirmSave = async () => {
    try {
      setSaving(true)
      const res = await fetch("/api/payroll/provident-fund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(formData),
      })
      const json = await res.json()
      if (json.success) {
        toast({ title: "Saved", description: "Provident fund settings saved successfully" })
        setConfirmOpen(false)
      } else {
        throw new Error(json.error || "Failed to save")
      }
    } catch (error: any) {
      console.error("Error saving provident fund:", error)
      toast({ title: "Error", description: error.message || "Failed to save provident fund settings", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <>
        <SidebarConfig role="hr" />
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
          <div className="text-center p-8">Loading provident fund settings...</div>
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
            <h1 className="text-xl font-bold">Provident Fund</h1>
            <p className="text-muted-foreground">Configure PF contributions, limits and charges</p>
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
              {/* Applicability Section */}
              <div>
                <Label className="mb-3 block text-base">Is provident fund settings applicable?</Label>
                <RadioGroup value={formData.hra_calc} onValueChange={(val) => handleInputChange('hra_calc', val)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Yes" id="applicable-yes" />
                    <Label htmlFor="applicable-yes" className="font-normal">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="No" id="applicable-no" />
                    <Label htmlFor="applicable-no" className="font-normal">No</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Account No. 1 - Employee Section */}
              <div>
                <h3 className="bg-muted p-3 mb-6 text-lg font-semibold">Account No. 1</h3>
                <div className="space-y-6">
                  <div>
                    <Label>Employees' PF contribution rate (A) % <span className="text-red-500">*</span></Label>
                    <Input
                      type="number"
                      step="any"
                      value={formData.pf_contribution}
                      onChange={(e) => handleInputChange('pf_contribution', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>

                  <div>
                    <Label className="mb-3 block">On what basis do you want to process employee's PF on?</Label>
                    <RadioGroup value={formData.pf} onValueChange={(val) => handleInputChange('pf', val)}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Actual earning for all employees" id="pf-actual" />
                        <Label htmlFor="pf-actual" className="font-normal">Actual earning for all employees</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Specify contribution limit at employee level" id="pf-specify" />
                        <Label htmlFor="pf-specify" className="font-normal">Specify contribution limit at employee level</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label>Employee's contribution <span className="text-red-500">*</span></Label>
                    <Input
                      type="number"
                      step="any"
                      value={formData.employee_contribution}
                      onChange={(e) => handleInputChange('employee_contribution', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>

                  <div>
                    <Label className="mb-3 block">On what basis do you want to calculate PF admin charges? (AC21)</Label>
                    <RadioGroup value={formData.admin_charge_basis} onValueChange={(val) => handleInputChange('admin_charge_basis', val)}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="PF wages" id="ac21-pf" />
                        <Label htmlFor="ac21-pf" className="font-normal">PF wages</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Pension wages" id="ac21-pension" />
                        <Label htmlFor="ac21-pension" className="font-normal">Pension wages</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="EDLI wages" id="ac21-edli" />
                        <Label htmlFor="ac21-edli" className="font-normal">EDLI wages</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label className="mb-3 block">On what basis of contribution do you want to compute PF admin charges? (AC2)</Label>
                    <RadioGroup value={formData.admin} onValueChange={(val) => handleInputChange('admin', val)}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Employee contribution" id="ac2-employee" />
                        <Label htmlFor="ac2-employee" className="font-normal">Employee contribution</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Employer contribution" id="ac2-employer" />
                        <Label htmlFor="ac2-employer" className="font-normal">Employer contribution</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Higher of employer and employee" id="ac2-higher" />
                        <Label htmlFor="ac2-higher" className="font-normal">Higher of employer and employee</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label className="mb-3 block">When generating the PF challan, would you like to include 'Gross Rate' or 'Gross Earnings' in the Gross Wages?</Label>
                    <RadioGroup value={formData.gross} onValueChange={(val) => handleInputChange('gross', val)}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Gross Rate" id="gross-rate" />
                        <Label htmlFor="gross-rate" className="font-normal">Gross Rate</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Gross earning" id="gross-earning" />
                        <Label htmlFor="gross-earning" className="font-normal">Gross earning</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </div>

              {/* Account No. 10 - Pension Section */}
              <div>
                <h3 className="bg-muted p-3 mb-6 text-lg font-semibold">Account No. 10</h3>
                <div className="space-y-6">
                  <div>
                    <Label>Employer's pension contribution rate (B) % <span className="text-red-500">*</span></Label>
                    <Input
                      type="number"
                      step="any"
                      value={formData.pension}
                      onChange={(e) => handleInputChange('pension', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>

                  <div>
                    <Label>Pension wage limit <span className="text-red-500">*</span></Label>
                    <Input
                      type="number"
                      value={formData.wage_limit}
                      onChange={(e) => handleInputChange('wage_limit', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>
                </div>
              </div>

              {/* Account No. 1 - Employer Section */}
              <div>
                <h3 className="bg-muted p-3 mb-6 text-lg font-semibold">Account No. 1 - Employer Contribution</h3>
                <div className="space-y-6">
                  <div>
                    <Label>Employer's PF contribution (A-B): 3.67</Label>
                    <p className="text-sm text-muted-foreground mt-1">This is automatically calculated</p>
                  </div>

                  <div>
                    <Label className="mb-3 block">On what do you want to process employer's PF on?</Label>
                    <RadioGroup value={formData.process} onValueChange={(val) => handleInputChange('process', val)}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Actual earnings" id="process-actual" />
                        <Label htmlFor="process-actual" className="font-normal">Actual earnings</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Specify contribution limit at employee level" id="process-specify" />
                        <Label htmlFor="process-specify" className="font-normal">Specify contribution limit at employee level</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label>Employers contribution limit <span className="text-red-500">*</span></Label>
                    <Input
                      type="number"
                      value={formData.contribution_limit}
                      onChange={(e) => handleInputChange('contribution_limit', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>
                </div>
              </div>

              {/* Account No. 2 */}
              <div>
                <h3 className="bg-muted p-3 mb-6 text-lg font-semibold">Account No. 2</h3>
                <div className="space-y-6">
                  <div>
                    <Label>PF admin charges rate % <span className="text-red-500">*</span></Label>
                    <Input
                      type="number"
                      step="any"
                      value={formData.charges_rate}
                      onChange={(e) => handleInputChange('charges_rate', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>

                  <div>
                    <Label>Minimum monthly PF admin charges <span className="text-red-500">*</span></Label>
                    <Input
                      type="number"
                      value={formData.admin_charge}
                      onChange={(e) => handleInputChange('admin_charge', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>
                </div>
              </div>

              {/* Account No. 21 */}
              <div>
                <h3 className="bg-muted p-3 mb-6 text-lg font-semibold">Account No. 21</h3>
                <div className="space-y-6">
                  <div>
                    <Label>EDLI contribution <span className="text-red-500">*</span></Label>
                    <Input
                      type="number"
                      step="any"
                      value={formData.edli_contribution}
                      onChange={(e) => handleInputChange('edli_contribution', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>
                </div>
              </div>

              {/* Account No. 22 */}
              <div>
                <h3 className="bg-muted p-3 mb-6 text-lg font-semibold">Account No. 22</h3>
                <div className="space-y-6">
                  <div>
                    <Label>EDLI admin charges rate % <span className="text-red-500">*</span></Label>
                    <Input
                      type="number"
                      value={formData.edli_rate}
                      onChange={(e) => handleInputChange('edli_rate', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>

                  <div>
                    <Label>Minimum monthly EDLI admin charges <span className="text-red-500">*</span></Label>
                    <Input
                      type="number"
                      value={formData.edli_charge}
                      onChange={(e) => handleInputChange('edli_charge', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>
                </div>
              </div>

              {/* Configuration */}
              <div>
                <h3 className="bg-muted p-3 mb-6 text-lg font-semibold">Configuration</h3>
                <div className="space-y-4">
                  <Label className="mb-3 block">Select whichever is applicable</Label>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="prorate-pf" 
                      checked={checkboxes.prorate_pf}
                      onCheckedChange={(checked) => handleCheckboxChange('prorate_pf', checked as boolean)}
                    />
                    <Label htmlFor="prorate-pf" className="font-normal">Prorate PF as per paid days</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="prorate-limit" 
                      checked={checkboxes.prorate_limit}
                      onCheckedChange={(checked) => handleCheckboxChange('prorate_limit', checked as boolean)}
                    />
                    <Label htmlFor="prorate-limit" className="font-normal">Prorate employee's PF contribution limit on paid days</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="process-arrears" 
                      checked={checkboxes.process_arrears}
                      onCheckedChange={(checked) => handleCheckboxChange('process_arrears', checked as boolean)}
                    />
                    <Label htmlFor="process-arrears" className="font-normal">Process PF on arrears</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="show-zero" 
                      checked={checkboxes.show_zero}
                      onCheckedChange={(checked) => handleCheckboxChange('show_zero', checked as boolean)}
                    />
                    <Label htmlFor="show-zero" className="font-normal">Show employees whose PF for the month is zero on challan</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="provision-admin" 
                      checked={checkboxes.provision_admin}
                      onCheckedChange={(checked) => handleCheckboxChange('provision_admin', checked as boolean)}
                    />
                    <Label htmlFor="provision-admin" className="font-normal">Do you want to provision PF admin charges in Employee CTC?</Label>
                  </div>
                </div>
              </div>

              {/* VPF Section */}
              <div>
                <h3 className="bg-muted p-3 mb-6 text-lg font-semibold">VPF</h3>
                <div className="space-y-6">
                  <div>
                    <Label className="mb-3 block">Is voluntary provident fund applicable?</Label>
                    <RadioGroup value={formData.fund} onValueChange={(val) => handleInputChange('fund', val)}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Yes" id="vpf-yes" />
                        <Label htmlFor="vpf-yes" className="font-normal">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="No" id="vpf-no" />
                        <Label htmlFor="vpf-no" className="font-normal">No</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label className="mb-3 block">Calculate VPF on</Label>
                    <RadioGroup value={formData.vpf} onValueChange={(val) => handleInputChange('vpf', val)}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="PF gross" id="vpf-gross" />
                        <Label htmlFor="vpf-gross" className="font-normal">PF gross</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="PF earning" id="vpf-earning" />
                        <Label htmlFor="vpf-earning" className="font-normal">PF earning</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </div>

              {/* Employer PF Perquisite */}
              <div>
                <h3 className="bg-muted p-3 mb-6 text-lg font-semibold">Employer PF Perquisite</h3>
                <div className="space-y-6">
                  <div>
                    <Label>PF Perquisite Rate <span className="text-red-500">*</span></Label>
                    <Input
                      type="number"
                      step="any"
                      value={formData.perquisite_rate}
                      onChange={(e) => handleInputChange('perquisite_rate', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>

                  <div>
                    <Label>PF Perquisite exemption limit <span className="text-red-500">*</span></Label>
                    <Input
                      type="number"
                      value={formData.exemption_limit}
                      onChange={(e) => handleInputChange('exemption_limit', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-center pt-6">
                <Button type="submit" className="w-48" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Save Provident Fund settings?</AlertDialogTitle>
              <AlertDialogDescription>
                This will update PF settings for payroll calculations.
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
