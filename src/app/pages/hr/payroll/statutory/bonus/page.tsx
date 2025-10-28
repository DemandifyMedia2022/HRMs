'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarConfig } from '@/components/sidebar-config';
import { Button } from '@/components/ui/button';
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

export default function BonusPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    bonus: 'No'
  });

  useEffect(() => {
    fetchBonus();
  }, []);

  const fetchBonus = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/payroll/bonus', {
        cache: 'no-store',
        credentials: 'include'
      });
      const json = await res.json();

      if (json.success && json.data) {
        const data = json.data;
        setFormData({
          bonus: data.bonus || 'No'
        });
      }
    } catch (error) {
      console.error('Error fetching bonus:', error);
      toast({
        title: 'Error',
        description: 'Failed to load bonus settings',
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
      const res = await fetch('/api/payroll/bonus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) {
        toast({ title: 'Saved', description: 'Bonus settings saved successfully' });
        setConfirmOpen(false);
      } else {
        throw new Error(json.error || 'Failed to save');
      }
    } catch (error: any) {
      console.error('Error saving bonus:', error);
      toast({ title: 'Error', description: error.message || 'Failed to save bonus settings', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <SidebarConfig role="hr" />
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
          <div className="text-center p-8">Loading bonus settings...</div>
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
            <h1 className="text-2xl font-bold">Bonus</h1>
            <p className="text-muted-foreground">Configure bonus applicability</p>
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
              {/* Bonus Applicability */}
              <div>
                <Label className="mb-3 block text-base">Is bonus applicable?</Label>
                <RadioGroup value={formData.bonus} onValueChange={val => handleInputChange('bonus', val)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Yes" id="bonus-yes" />
                    <Label htmlFor="bonus-yes" className="font-normal">
                      Yes
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="No" id="bonus-no" />
                    <Label htmlFor="bonus-no" className="font-normal">
                      No
                    </Label>
                  </div>
                </RadioGroup>
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
              <AlertDialogTitle>Save Bonus settings?</AlertDialogTitle>
              <AlertDialogDescription>This will update bonus settings for payroll calculations.</AlertDialogDescription>
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
