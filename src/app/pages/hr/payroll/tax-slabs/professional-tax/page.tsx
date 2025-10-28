'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarConfig } from '@/components/sidebar-config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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

type SlabData = {
  id?: number;
  state: string;
  branch: string;
  min_limit1: string;
  max_limit1: string;
  gender1: string;
  apr1: string;
  may1: string;
  jun1: string;
  jul1: string;
  aug1: string;
  sep1: string;
  oct1: string;
  nov1: string;
  dec1: string;
  jan1: string;
  feb1: string;
  mar1: string;
  min_limit2: string;
  max_limit2: string;
  gender2: string;
  apr2: string;
  may2: string;
  jun2: string;
  jul2: string;
  aug2: string;
  sep2: string;
  oct2: string;
  nov2: string;
  dec2: string;
  jan2: string;
  feb2: string;
  mar2: string;
  min_limit3: string;
  max_limit3: string;
  gender3: string;
  apr3: string;
  may3: string;
  jun3: string;
  jul3: string;
  aug3: string;
  sep3: string;
  oct3: string;
  nov3: string;
  dec3: string;
  jan3: string;
  feb3: string;
  mar3: string;
  min_limit4: string;
  max_limit4: string;
  gender4: string;
  apr4: string;
  may4: string;
  jun4: string;
  jul4: string;
  aug4: string;
  sep4: string;
  oct4: string;
  nov4: string;
  dec4: string;
  jan4: string;
  feb4: string;
  mar4: string;
  min_limit5: string;
  max_limit5: string;
  gender5: string;
  apr5: string;
  may5: string;
  jun5: string;
  jul5: string;
  aug5: string;
  sep5: string;
  oct5: string;
  nov5: string;
  dec5: string;
  jan5: string;
  feb5: string;
  mar5: string;
};

const months = ['apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar'];
const monthLabels = [
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
  'January',
  'February',
  'March'
];

export default function ProfessionalTaxPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<SlabData>({
    state: 'Maharashtra',
    branch: 'Pune',
    min_limit1: '0',
    max_limit1: '0',
    gender1: 'All',
    apr1: '0',
    may1: '0',
    jun1: '0',
    jul1: '0',
    aug1: '0',
    sep1: '0',
    oct1: '0',
    nov1: '0',
    dec1: '0',
    jan1: '0',
    feb1: '0',
    mar1: '0',
    min_limit2: '0',
    max_limit2: '0',
    gender2: 'All',
    apr2: '0',
    may2: '0',
    jun2: '0',
    jul2: '0',
    aug2: '0',
    sep2: '0',
    oct2: '0',
    nov2: '0',
    dec2: '0',
    jan2: '0',
    feb2: '0',
    mar2: '0',
    min_limit3: '0',
    max_limit3: '0',
    gender3: 'All',
    apr3: '0',
    may3: '0',
    jun3: '0',
    jul3: '0',
    aug3: '0',
    sep3: '0',
    oct3: '0',
    nov3: '0',
    dec3: '0',
    jan3: '0',
    feb3: '0',
    mar3: '0',
    min_limit4: '0',
    max_limit4: '0',
    gender4: 'All',
    apr4: '0',
    may4: '0',
    jun4: '0',
    jul4: '0',
    aug4: '0',
    sep4: '0',
    oct4: '0',
    nov4: '0',
    dec4: '0',
    jan4: '0',
    feb4: '0',
    mar4: '0',
    min_limit5: '0',
    max_limit5: '0',
    gender5: 'All',
    apr5: '0',
    may5: '0',
    jun5: '0',
    jul5: '0',
    aug5: '0',
    sep5: '0',
    oct5: '0',
    nov5: '0',
    dec5: '0',
    jan5: '0',
    feb5: '0',
    mar5: '0'
  });

  useEffect(() => {
    fetchSlabData();
  }, []);

  const fetchSlabData = async () => {
    try {
      setLoading(true);
      // Add timestamp to bust cache
      const timestamp = new Date().getTime();
      const res = await fetch(`/api/payroll/professional-tax-slabs?_t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache'
        }
      });
      const json = await res.json();
      if (json.success && json.data) {
        console.log('Fetched updated data:', json.data);
        // Ensure null values are converted to proper defaults
        const cleanedData = {
          ...json.data,
          branch: json.data.branch || 'Pune',
          state: json.data.state || 'Maharashtra'
        };
        console.log('Setting form data with cleaned data:', cleanedData);
        setFormData(cleanedData);
      }
    } catch (error) {
      console.error('Error fetching slab data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof SlabData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const saveSlabs = async () => {
    try {
      const res = await fetch('/api/payroll/professional-tax-slabs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) {
        toast({ title: 'Saved', description: 'Professional tax slabs saved successfully' });
        await fetchSlabData();
        setConfirmOpen(false);
      } else {
        throw new Error(json.error || 'Failed to save');
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to save slabs', variant: 'destructive' });
    }
  };

  const renderSlab = (slabNumber: number) => {
    const slabSuffix = slabNumber.toString();
    return (
      <Card key={slabNumber}>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Slab {slabNumber}</h3>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <Label>State*</Label>
              <Input value={formData.state} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Branch*</Label>
              <Select value={formData.branch} onValueChange={(val: string) => handleInputChange('branch', val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pune">Pune</SelectItem>
                  <SelectItem value="Mumbai">Mumbai</SelectItem>
                  <SelectItem value="Nagpur">Nagpur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Minimum limit of PT*</Label>
              <Input
                type="text"
                value={formData[`min_limit${slabSuffix}` as keyof SlabData] as string}
                onChange={e => handleInputChange(`min_limit${slabSuffix}` as keyof SlabData, e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Maximum limit of PT*</Label>
              <Input
                type="text"
                value={formData[`max_limit${slabSuffix}` as keyof SlabData] as string}
                onChange={e => handleInputChange(`max_limit${slabSuffix}` as keyof SlabData, e.target.value)}
              />
            </div>
          </div>

          <div className="mb-6">
            <Label className="mb-3 block">PT slab is applicable for</Label>
            <RadioGroup
              value={String(formData[`gender${slabSuffix}` as keyof SlabData] || 'All')}
              onValueChange={val => handleInputChange(`gender${slabSuffix}` as keyof SlabData, val)}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem id={`all-${slabNumber}`} value="All" />
                <Label htmlFor={`all-${slabNumber}`} className="font-normal cursor-pointer">
                  All
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem id={`male-${slabNumber}`} value="Male" />
                <Label htmlFor={`male-${slabNumber}`} className="font-normal cursor-pointer">
                  Male
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem id={`female-${slabNumber}`} value="Female" />
                <Label htmlFor={`female-${slabNumber}`} className="font-normal cursor-pointer">
                  Female
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label className="mb-4 block font-semibold">Employee contribution for every month *</Label>
            <div className="grid grid-cols-4 gap-4">
              {months.map((month, idx) => (
                <div key={month} className="space-y-2">
                  <Label>{monthLabels[idx]}*</Label>
                  <Input
                    type="text"
                    value={formData[`${month}${slabSuffix}` as keyof SlabData] as string}
                    onChange={e => handleInputChange(`${month}${slabSuffix}` as keyof SlabData, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <>
        <SidebarConfig role="hr" />
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
          <div className="text-center p-8">Loading professional tax slabs...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <SidebarConfig role="hr" />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-xl font-bold">Professional Tax Slabs</h1>
            <p className="text-muted-foreground">Manage monthly PT slabs and limits</p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              Back
            </Button>
          </div>
        </div>
        <div className="flex">
          {/* Sidebar */}
          <div className="w-48 bg-muted/30 p-4 rounded-lg mr-6">
            <div className="text-lg font-bold text-emerald-700">2024 - 2025</div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="mb-6 pb-4 border-b-2 border-primary">
              <h1 className="text-xl font-bold text-primary">Tax Slab - Professional Tax</h1>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Slabs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6" key={formData.id || 'default'}>
                {[1, 2, 3, 4, 5].map(slabNum => renderSlab(slabNum))}

                <div className="text-center py-6">
                  <Button onClick={() => setConfirmOpen(true)} className="w-32">
                    Save
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save Professional Tax slabs?</AlertDialogTitle>
            <AlertDialogDescription>
              This will update PT slab configuration used in payroll calculations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={saveSlabs}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
