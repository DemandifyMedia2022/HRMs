'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarConfig } from '@/components/sidebar-config';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type TaxSlab = {
  serial: number;
  tax_regime: string;
  lower_limit: number;
  upper_limit: number;
  tax_percentage: number;
};

type CategoryData = {
  category: string;
  slabs: TaxSlab[];
};

export default function SlabsDetailsPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<string>('individual');
  const [taxData, setTaxData] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);

  const categories = [
    { id: 'individual', label: 'Individual' },
    { id: 'senior-citizen', label: 'Senior Citizen' },
    { id: 'super-senior-citizen', label: 'Super Senior Citizen' }
  ];

  useEffect(() => {
    fetchTaxSlabs();
  }, []);

  const fetchTaxSlabs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/payroll/tax-slabs-details', {
        cache: 'no-store',
        credentials: 'include' // Required to send session cookie
      });
      const json = await res.json();
      if (json.success && json.data) {
        setTaxData(json.data);
      }
    } catch (error) {
      console.error('Error fetching tax slabs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActiveCategoryData = () => {
    const data = taxData.find(d => d.category === activeCategory);
    return data?.slabs || [];
  };

  if (loading) {
    return (
      <>
        <SidebarConfig role="hr" />
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
          <div className="text-center p-8">Loading tax slabs...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <SidebarConfig role="hr" />
      <div className="p-6 space-y-4 ">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-xl font-bold">Income Tax Slabs</h1>
            <p className="text-muted-foreground">View slab ranges and rates by category</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              Back
            </Button>
          </div>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 bg-muted/30 p-6 rounded-lg mr-6">
            <ul className="space-y-4">
              {categories.map(cat => (
                <li
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`cursor-pointer transition-colors ${
                    activeCategory === cat.id
                      ? 'text-emerald-600 font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {cat.label}
                </li>
              ))}
            </ul>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="mb-6 pb-4 border-b-2 border-primary">
              <h1 className="text-xl font-bold text-primary">
                Tax Slab - {categories.find(c => c.id === activeCategory)?.label}
              </h1>
            </div>

            <div className="bg-background rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-bold">Serial</TableHead>
                    <TableHead className="font-bold">Tax Regime</TableHead>
                    <TableHead className="font-bold">Lower Limit</TableHead>
                    <TableHead className="font-bold">Upper Limit</TableHead>
                    <TableHead className="font-bold">Tax Percentage (%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getActiveCategoryData().length > 0 ? (
                    getActiveCategoryData().map((slab, index) => (
                      <TableRow key={index} className={index % 2 === 1 ? 'bg-muted/20' : ''}>
                        <TableCell>{slab.serial}</TableCell>
                        <TableCell className="font-medium">{slab.tax_regime}</TableCell>
                        <TableCell>₹{slab.lower_limit.toLocaleString()}</TableCell>
                        <TableCell>₹{slab.upper_limit.toLocaleString()}</TableCell>
                        <TableCell>{slab.tax_percentage}%</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No tax slabs available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
