'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarConfig } from '@/components/sidebar-config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';

export default function TaxSettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    children_no: '',
    tution_fees: '',
    hostel_fees: '',
    net_taxable_old: '',
    net_taxable_new: '',
    tax_rebate_old: '',
    tax_rebate_new: '',
    standard_deduction_old: '',
    standard_deduction_new: '',
    annuation_exemption: '',
    propose_investment: '',
    confirm_investment: '',
    month: '',
    rent_paid: '',
    house_property: '',
    housing_loan: '',
    cess_charge: '',
    Senior_citizen_age: '',
    super_citizen_age: '',
    lta_block_start: '',
    lta_block_end: '',
    hra_calc: 'Prorate with DOJ, projected DOL',
    tdspan: 'No',
    tdsadhar: 'No',
    adhar: 'No',
    tds: 'No',
    income: 'No',
    challantax: 'No',
    taxable: '10 rupees',
    component: 'Proportionate'
  });

  useEffect(() => {
    fetchTaxSettings();
  }, []);

  const fetchTaxSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/payroll/tax-settings', {
        cache: 'no-store',
        credentials: 'include'
      });
      const json = await res.json();
      if (json.success && json.data) {
        // Convert data to string format for form inputs
        const data = json.data;
        setFormData({
          children_no: data.children_no?.toString() || '',
          tution_fees: data.tution_fees || '',
          hostel_fees: data.hostel_fees || '',
          net_taxable_old: data.net_taxable_old || '',
          net_taxable_new: data.net_taxable_new || '',
          tax_rebate_old: data.tax_rebate_old || '',
          tax_rebate_new: data.tax_rebate_new || '',
          standard_deduction_old: data.standard_deduction_old || '',
          standard_deduction_new: data.standard_deduction_new || '',
          annuation_exemption: data.annuation_exemption || '',
          propose_investment: data.propose_investment || '',
          confirm_investment: data.confirm_investment || '',
          month: data.month || '',
          rent_paid: data.rent_paid || '',
          house_property: data.house_property || '',
          housing_loan: data.housing_loan || '',
          cess_charge: data.cess_charge || '',
          Senior_citizen_age: data.Senior_citizen_age?.toString() || '',
          super_citizen_age: data.super_citizen_age?.toString() || '',
          lta_block_start: data.lta_block_start?.toString() || '',
          lta_block_end: data.lta_block_end?.toString() || '',
          hra_calc: data.hra_calc || 'Prorate with DOJ, projected DOL',
          tdspan: data.tdspan || 'No',
          tdsadhar: data.tdsadhar || 'No',
          adhar: data.adhar || 'No',
          tds: data.tds || 'No',
          income: data.income || 'No',
          challantax: data.challantax || 'No',
          taxable: data.taxable || '10 rupees',
          component: data.component || 'Proportionate'
        });
      }
    } catch (error) {
      console.error('Error fetching tax settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load tax settings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setConfirmOpen(true);
  };

  const onConfirmSave = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/payroll/tax-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) {
        toast({ title: 'Saved', description: 'Tax settings saved successfully' });
        setConfirmOpen(false);
      } else {
        throw new Error(json.error || 'Failed to save');
      }
    } catch (error: any) {
      console.error('Error saving tax settings:', error);
      toast({ title: 'Error', description: error.message || 'Failed to save tax settings', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <SidebarConfig role="hr" />
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
          <div className="text-center p-8">Loading tax settings...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <SidebarConfig role="hr" />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Tax Settings</h1>
            <p className="text-muted-foreground">Configure tax exemptions, deductions and TDS defaults</p>
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
              {/* Exemption Section */}
              <div>
                <h3 className="bg-muted p-3 mb-6 text-lg font-semibold">Exemption</h3>
                <div className="space-y-6">
                  <div>
                    <Label>
                      For how many children education allowance would be admissible ?{' '}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      value={formData.children_no}
                      onChange={e => handleInputChange('children_no', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>

                  <div>
                    <Label>
                      Maximum tuition fees exemption for children going to school (annually) ?{' '}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      value={formData.tution_fees}
                      onChange={e => handleInputChange('tution_fees', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>

                  <div>
                    <Label>
                      Maximum amount exemption for children going to hostel (annually) ?{' '}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      value={formData.hostel_fees}
                      onChange={e => handleInputChange('hostel_fees', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>

                  <div>
                    <Label>
                      Maximum net taxable amount to avail tax rebate (Old regime){' '}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      value={formData.net_taxable_old}
                      onChange={e => handleInputChange('net_taxable_old', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>

                  <div>
                    <Label>
                      Maximum net taxable amount to avail tax rebate (New regime){' '}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      value={formData.net_taxable_new}
                      onChange={e => handleInputChange('net_taxable_new', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>

                  <div>
                    <Label>
                      Tax rebate amount (87 A) (Old regime) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      value={formData.tax_rebate_old}
                      onChange={e => handleInputChange('tax_rebate_old', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>

                  <div>
                    <Label>
                      Tax rebate amount (87 A) (New regime) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      value={formData.tax_rebate_new}
                      onChange={e => handleInputChange('tax_rebate_new', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>

                  <div>
                    <Label>
                      Standard deduction (Old regime) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      value={formData.standard_deduction_old}
                      onChange={e => handleInputChange('standard_deduction_old', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>

                  <div>
                    <Label>
                      Standard deduction (New regime) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      value={formData.standard_deduction_new}
                      onChange={e => handleInputChange('standard_deduction_new', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>

                  <div>
                    <Label>
                      Super annuation exemption limit <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      value={formData.annuation_exemption}
                      onChange={e => handleInputChange('annuation_exemption', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>
                </div>
              </div>

              {/* Investment Section */}
              <div>
                <h3 className="bg-muted p-3 mb-6 text-lg font-semibold">Investment</h3>
                <div className="space-y-6">
                  <div>
                    <Label>
                      Maximum number of propose investment declaration requests in an year{' '}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      value={formData.propose_investment}
                      onChange={e => handleInputChange('propose_investment', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>

                  <div>
                    <Label>
                      Maximum number of confirm investment declaration requests in an year{' '}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      value={formData.confirm_investment}
                      onChange={e => handleInputChange('confirm_investment', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>

                  <div>
                    <Label>From which month tax should be processed considering the confirmed investment</Label>
                    <Input
                      type="text"
                      value={formData.month}
                      onChange={e => handleInputChange('month', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>

                  <div>
                    <Label>
                      From which month should pay by default reimbursements be processed as per bills submitted
                    </Label>
                    <Input
                      type="text"
                      value={formData.month}
                      onChange={e => handleInputChange('month', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>

                  <div>
                    <Label className="mb-2 block">HRA exemption calculation</Label>
                    <RadioGroup value={formData.hra_calc} onValueChange={val => handleInputChange('hra_calc', val)}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Prorate with DOJ, projected DOL" id="hra1" />
                        <Label htmlFor="hra1" className="font-normal">
                          Prorate with DOJ, projected DOL
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Actual rent paid amount" id="hra2" />
                        <Label htmlFor="hra2" className="font-normal">
                          Actual rent paid amount
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label>
                      Annual rent paid limit to ensure PAN availability of landlord{' '}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      value={formData.rent_paid}
                      onChange={e => handleInputChange('rent_paid', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>

                  <div>
                    <Label>
                      Loss from house property exemption limit <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      value={formData.house_property}
                      onChange={e => handleInputChange('house_property', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>

                  <div>
                    <Label>
                      Interest paid on housing loan exemption limit <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      value={formData.housing_loan}
                      onChange={e => handleInputChange('housing_loan', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>
                </div>
              </div>

              {/* TDS Section */}
              <div>
                <h3 className="bg-muted p-3 mb-6 text-lg font-semibold">TDS</h3>
                <div className="space-y-6">
                  <div>
                    <Label>
                      Education cess charge (%) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      value={formData.cess_charge}
                      onChange={e => handleInputChange('cess_charge', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>

                  <div>
                    <Label className="mb-2 block">
                      Do you want to deduct TDS in higher slab (if PAN not available)?
                    </Label>
                    <RadioGroup value={formData.tdspan} onValueChange={val => handleInputChange('tdspan', val)}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Yes" id="tdspan-yes" />
                        <Label htmlFor="tdspan-yes" className="font-normal">
                          Yes
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="No" id="tdspan-no" />
                        <Label htmlFor="tdspan-no" className="font-normal">
                          No
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label className="mb-2 block">
                      Do you want to deduct TDS in higher slab (if Aadhaar is not available)?
                    </Label>
                    <RadioGroup value={formData.tdsadhar} onValueChange={val => handleInputChange('tdsadhar', val)}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Yes" id="tdsadhar-yes" />
                        <Label htmlFor="tdsadhar-yes" className="font-normal">
                          Yes
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="No" id="tdsadhar-no" />
                        <Label htmlFor="tdsadhar-no" className="font-normal">
                          No
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label className="mb-2 block">
                      Do you want to deduct TDS in higher slab (if Aadhar is not linked with PAN)?
                    </Label>
                    <RadioGroup value={formData.adhar} onValueChange={val => handleInputChange('adhar', val)}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Yes" id="adhar-yes" />
                        <Label htmlFor="adhar-yes" className="font-normal">
                          Yes
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="No" id="adhar-no" />
                        <Label htmlFor="adhar-no" className="font-normal">
                          No
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label className="mb-2 block">
                      Do you want to deposit income tax of employees whose salary is withheld?
                    </Label>
                    <RadioGroup value={formData.tds} onValueChange={val => handleInputChange('tds', val)}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Yes" id="tds-yes" />
                        <Label htmlFor="tds-yes" className="font-normal">
                          Yes
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="No" id="tds-no" />
                        <Label htmlFor="tds-no" className="font-normal">
                          No
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label className="mb-2 block">Do you want to show employees whose Income Tax is Zero?</Label>
                    <RadioGroup value={formData.income} onValueChange={val => handleInputChange('income', val)}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Yes" id="income-yes" />
                        <Label htmlFor="income-yes" className="font-normal">
                          Yes
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="No" id="income-no" />
                        <Label htmlFor="income-no" className="font-normal">
                          No
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label>
                      Senior citizen age for income tax <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      value={formData.Senior_citizen_age}
                      onChange={e => handleInputChange('Senior_citizen_age', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>

                  <div>
                    <Label>
                      Super senior citizen age for income tax <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      value={formData.super_citizen_age}
                      onChange={e => handleInputChange('super_citizen_age', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>

                  <div>
                    <Label>
                      Current LTA block period (start year) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      value={formData.lta_block_start}
                      onChange={e => handleInputChange('lta_block_start', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>

                  <div>
                    <Label>
                      Current LTA block period (end year) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      value={formData.lta_block_end}
                      onChange={e => handleInputChange('lta_block_end', e.target.value)}
                      className="border-b border-t-0 border-l-0 border-r-0 border-dashed rounded-none"
                    />
                  </div>

                  <div>
                    <Label className="mb-2 block">
                      Do you want to add the tax deducted on perquisites with tax challan?
                    </Label>
                    <RadioGroup value={formData.challantax} onValueChange={val => handleInputChange('challantax', val)}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Yes" id="challantax-yes" />
                        <Label htmlFor="challantax-yes" className="font-normal">
                          Yes
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="No" id="challantax-no" />
                        <Label htmlFor="challantax-no" className="font-normal">
                          No
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label className="mb-2 block">Round off net taxable salary on</Label>
                    <RadioGroup value={formData.taxable} onValueChange={val => handleInputChange('taxable', val)}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="5 rupees" id="taxable-5" />
                        <Label htmlFor="taxable-5" className="font-normal">
                          5 rupees
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="10 rupees" id="taxable-10" />
                        <Label htmlFor="taxable-10" className="font-normal">
                          10 rupees
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label className="mb-2 block">
                      In case the pay component is taxed on a proportionate basis, then how do you want to treat tax on
                      the arrear part of these components?
                    </Label>
                    <RadioGroup value={formData.component} onValueChange={val => handleInputChange('component', val)}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Proportionate" id="component-prop" />
                        <Label htmlFor="component-prop" className="font-normal">
                          Proportionate
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Pay month" id="component-pay" />
                        <Label htmlFor="component-pay" className="font-normal">
                          Pay month
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </div>

              <div className="flex justify-center pt-6">
                <Button type="submit" className="w-48" disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Save Tax settings?</AlertDialogTitle>
              <AlertDialogDescription>
                This will update default tax configuration used across payroll.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onConfirmSave} disabled={saving}>
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
}
