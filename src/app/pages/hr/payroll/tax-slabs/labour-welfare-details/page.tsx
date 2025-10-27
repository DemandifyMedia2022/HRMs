'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SidebarConfig } from '@/components/sidebar-config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IconX, IconPlus } from '@tabler/icons-react';
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

type LabourWelfareSlab = {
  id: string;
  name: string;
  state: string;
  branch: string;
  minApplicability: number;
  maxApplicability: number;
  employeeContribution: {
    [month: string]: number;
  };
  employerContribution: {
    [month: string]: number;
  };
};

const months = [
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

export default function LabourWelfareDetailsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [slabs, setSlabs] = useState<LabourWelfareSlab[]>([]);
  const [selectedSlabId, setSelectedSlabId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<LabourWelfareSlab>({
    id: '',
    name: 'Slab for Pune(3001-999999999)',
    state: 'Maharashtra',
    branch: 'Pune',
    minApplicability: 3001,
    maxApplicability: 999999999,
    employeeContribution: {
      April: 0,
      May: 0,
      June: 12,
      July: 0,
      August: 0,
      September: 0,
      October: 0,
      November: 0,
      December: 12,
      January: 0,
      February: 0,
      March: 0
    },
    employerContribution: {
      April: 0,
      May: 0,
      June: 36,
      July: 0,
      August: 0,
      September: 0,
      October: 0,
      November: 0,
      December: 36,
      January: 0,
      February: 0,
      March: 0
    }
  });

  useEffect(() => {
    fetchSlabs();
  }, []);

  const fetchSlabs = async () => {
    try {
      const res = await fetch('/api/payroll/labour-welfare-fund', { cache: 'no-store' });
      const json = await res.json();
      if (json.success && json.data) {
        setSlabs(json.data);
        if (json.data.length > 0) {
          setSelectedSlabId(json.data[0].id);
          setFormData(json.data[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching labour welfare fund slabs:', error);
    }
  };

  const handleInputChange = (field: keyof LabourWelfareSlab, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEmployeeContributionChange = (month: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      employeeContribution: { ...prev.employeeContribution, [month]: value }
    }));
  };

  const handleEmployerContributionChange = (month: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      employerContribution: { ...prev.employerContribution, [month]: value }
    }));
  };

  const handleSlabSelect = (slabId: string) => {
    const slab = slabs.find(s => s.id === slabId);
    if (slab) {
      setFormData(slab);
      setSelectedSlabId(slabId);
    }
  };

  const handleSave = () => setConfirmOpen(true);

  const onConfirmSave = async () => {
    try {
      setSaving(true);
      const method = formData.id ? 'PUT' : 'POST';
      const res = await fetch('/api/payroll/labour-welfare-fund', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) {
        toast({ title: 'Saved', description: 'Labour welfare fund slab saved successfully' });
        setConfirmOpen(false);
        fetchSlabs();
      } else {
        throw new Error(json.error || 'Failed to save slab');
      }
    } catch (error: any) {
      console.error('Error saving slab:', error);
      toast({ title: 'Error', description: error.message || 'Failed to save slab', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <SidebarConfig role="hr" />
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-xl font-bold">Labour Welfare Fund</h1>
            <p className="text-muted-foreground">Manage labour welfare fund slabs and contributions</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              Back
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex gap-6">
          {/* Sidebar */}
          <Card className="w-64 h-fit">
            <CardHeader>
              <Button className="w-full" size="sm">
                <IconPlus className="h-4 w-4 mr-2" />
                Add Slabs
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-0">
                {slabs.map(slab => (
                  <button
                    key={slab.id}
                    onClick={() => handleSlabSelect(slab.id)}
                    className={`w-full text-left px-4 py-3 text-sm border-b transition-colors hover:bg-muted ${
                      selectedSlabId === slab.id ? 'bg-emerald-50 font-semibold' : ''
                    }`}
                  >
                    {slab.name}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Form Section */}
          <div className="flex-1 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="slabName">
                      Slab name<span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="slabName"
                      value={formData.name}
                      onChange={e => handleInputChange('name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">
                      State<span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.state} onValueChange={val => handleInputChange('state', val)}>
                      <SelectTrigger id="state">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Maharashtra">Maharashtra</SelectItem>
                        <SelectItem value="Karnataka">Karnataka</SelectItem>
                        <SelectItem value="Gujarat">Gujarat</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="branch">
                      Branch<span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="branch"
                      value={formData.branch}
                      onChange={e => handleInputChange('branch', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minApplicability">
                      Minimum LWF applicability<span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="minApplicability"
                      type="number"
                      value={formData.minApplicability}
                      onChange={e => handleInputChange('minApplicability', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxApplicability">
                      Maximum LWF applicability<span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="maxApplicability"
                      type="number"
                      value={formData.maxApplicability}
                      onChange={e => handleInputChange('maxApplicability', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Employee Contribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-blue-700">Employee contribution for every month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-6">
                  {months.map(month => (
                    <div key={month} className="space-y-2">
                      <Label htmlFor={`emp-${month}`} className="font-semibold">
                        {month}*
                      </Label>
                      <Input
                        id={`emp-${month}`}
                        type="number"
                        value={formData.employeeContribution[month]}
                        onChange={e => handleEmployeeContributionChange(month, parseInt(e.target.value) || 0)}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Employer Contribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-blue-700">Employer contribution for every month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-6">
                  {months.map(month => (
                    <div key={month} className="space-y-2">
                      <Label htmlFor={`empr-${month}`} className="font-semibold">
                        {month}*
                      </Label>
                      <Input
                        id={`empr-${month}`}
                        type="number"
                        value={formData.employerContribution[month]}
                        onChange={e => handleEmployerContributionChange(month, parseInt(e.target.value) || 0)}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                Save Changes
              </Button>
            </div>
          </div>
        </div>
        {/* Confirm dialog */}
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Save Labour Welfare slab?</AlertDialogTitle>
              <AlertDialogDescription>This will update the selected slab configuration.</AlertDialogDescription>
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
