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

export default function GratuityPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    Gratuity: 'No'
  });

  useEffect(() => {
    fetchGratuity();
  }, []);

  const fetchGratuity = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/payroll/gratuity', {
        cache: 'no-store',
        credentials: 'include'
      });
      const json = await res.json();

      if (json.success && json.data) {
        const data = json.data;
        setFormData({
          Gratuity: data.Gratuity || 'No'
        });
      }
    } catch (error) {
      console.error('Error fetching gratuity:', error);
      toast({
        title: 'Error',
        description: 'Failed to load gratuity settings',
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
      const res = await fetch('/api/payroll/gratuity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) {
        toast({ title: 'Saved', description: 'Gratuity settings saved successfully' });
        setConfirmOpen(false);
      } else {
        throw new Error(json.error || 'Failed to save');
      }
    } catch (error: any) {
      console.error('Error saving gratuity:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save gratuity settings',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <SidebarConfig role="hr" />
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
          <div className="text-center p-8">Loading gratuity settings...</div>
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
            <h1 className="text-2xl font-bold">Gratuity</h1>
            <p className="text-muted-foreground">Configure gratuity applicability</p>
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
              {/* Gratuity Applicability */}
              <div>
                <Label className="mb-3 block text-base">Is gratuity applicable?</Label>
                <RadioGroup value={formData.Gratuity} onValueChange={val => handleInputChange('Gratuity', val)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Yes" id="gratuity-yes" />
                    <Label htmlFor="gratuity-yes" className="font-normal">
                      Yes
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="No" id="gratuity-no" />
                    <Label htmlFor="gratuity-no" className="font-normal">
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
              <AlertDialogTitle>Save Gratuity settings?</AlertDialogTitle>
              <AlertDialogDescription>
                This will update gratuity settings for payroll calculations.
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
