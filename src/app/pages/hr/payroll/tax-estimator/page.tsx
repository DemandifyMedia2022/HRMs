'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SidebarConfig } from '@/components/sidebar-config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Card as UCard,
  CardContent as UCardContent,
  CardHeader as UCardHeader,
  CardTitle as UCardTitle
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from '@/components/ui/chart';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { IconEye } from '@tabler/icons-react';

type TaxEstimation = {
  user_id: string;
  Full_name: string;
  emp_code: string;
  Gross_salary: string;
  salary_head: string;
  variable_amount: string;
  employer_details: string;
  Income_from_other: string;
  HRA_80GG: string;
  HRA_Exempted: string;
  A_80C: string;
  A_Others: string;
  Standard_Deduction: string;
  Net_taxable_income: string;
  Annual_Projected_TDS: string;
  TDS_deducted: string;
  Remaining_Tax: string;
  TDS_subsequent_month: string;
  TDS_this_month: string;
  Total_Tax: string;
  Gross_salary1: string;
  salary_head1: string;
  variable_amount1: string;
  employer_details1: string;
  Income_from_other1: string;
  A_Others1: string;
  Standard_Deduction1: string;
  Net_taxable_income1: string;
  Annual_Projected_TDS1: string;
  TDS_deducted1: string;
  Remaining_Tax1: string;
  TDS_subsequent_month1: string;
  TDS_this_month1: string;
  Total_Tax1: string;
};

export default function TaxEstimatorPage() {
  const [taxData, setTaxData] = useState<TaxEstimation[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<TaxEstimation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTaxEstimations();
  }, []);

  const fetchTaxEstimations = async () => {
    try {
      const res = await fetch('/api/payroll/tax-estimator');
      const data = await res.json();
      if (data.success) {
        setTaxData(data.data);
      } else {
        toast({ title: 'Error', description: 'Failed to load tax estimations', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (employee: TaxEstimation) => {
    setSelectedEmployee(employee);
    setIsModalOpen(true);
  };

  return (
    <>
      <SidebarConfig role="hr" />
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Tax Estimation</h1>
            <p className="text-muted-foreground">View employee tax estimations</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/pages/hr/payroll/tax">Back</Link>
            </Button>
          </div>
        </div>

        {/* Quick Nav */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/pages/hr/payroll/tax">Tax Structure</Link>
              </Button>
              <Button variant="default" size="sm" asChild>
                <Link href="/pages/hr/payroll/tax-estimator/update">Update Tax Estimation</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Employee Tax Estimations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">ID</th>
                    <th className="text-left p-3 font-medium">Name</th>
                    <th className="text-left p-3 font-medium">Employee Code</th>
                    <th className="text-center p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="text-center p-4 text-muted-foreground">
                        Loading...
                      </td>
                    </tr>
                  ) : taxData.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center p-4 text-muted-foreground">
                        No tax estimation data available
                      </td>
                    </tr>
                  ) : (
                    taxData.map(employee => (
                      <tr key={employee.user_id} className="border-b hover:bg-muted/50">
                        <td className="p-3">{employee.user_id}</td>
                        <td className="p-3">{employee.Full_name}</td>
                        <td className="p-3">{employee.emp_code}</td>
                        <td className="p-3 text-center">
                          <Button size="sm" variant="outline" onClick={() => handleViewDetails(employee)}>
                            <IconEye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tax Details - {selectedEmployee?.Full_name}</DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <div className="space-y-6">
              {/* Summary Pie */}
              <UCard>
                <UCardHeader className="pb-2">
                  <UCardTitle className="text-base">Summary</UCardTitle>
                </UCardHeader>
                <UCardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="rounded-md border p-3">
                      <div className="text-xs text-muted-foreground">Old Regime Tax</div>
                      <div className="text-lg font-semibold">
                        ₹{Number.parseFloat(selectedEmployee.Total_Tax || '0').toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="rounded-md border p-3">
                      <div className="text-xs text-muted-foreground">New Regime Tax</div>
                      <div className="text-lg font-semibold">
                        ₹{Number.parseFloat(selectedEmployee.Total_Tax1 || '0').toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="rounded-md border p-3">
                      <div className="text-xs text-muted-foreground">Difference</div>
                      <div className="text-lg font-semibold">
                        ₹
                        {Math.abs(
                          (Number(selectedEmployee.Total_Tax1) || 0) - (Number(selectedEmployee.Total_Tax) || 0)
                        ).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                  <ChartContainer config={{}}>
                    <div className="w-full">
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Old Regime', value: Number(selectedEmployee.Total_Tax || 0) },
                              { name: 'New Regime', value: Number(selectedEmployee.Total_Tax1 || 0) }
                            ]}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={2}
                            label
                          >
                            <Cell fill="var(--chart-5)" />
                            <Cell fill="var(--chart-1)" />
                          </Pie>
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <ChartLegend content={<ChartLegendContent />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </ChartContainer>
                </UCardContent>
              </UCard>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Old Tax Regime */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg mb-3">Old Tax Regime</h3>
                  <DetailRow label="Name" value={selectedEmployee.Full_name} />
                  <DetailRow label="Employee Code" value={selectedEmployee.emp_code} />
                  <DetailRow label="Gross Salary" value={selectedEmployee.Gross_salary} />
                  <DetailRow label="Salary Head" value={selectedEmployee.salary_head} />
                  <DetailRow label="Variable Amount" value={selectedEmployee.variable_amount} />
                  <DetailRow label="Employer Details" value={selectedEmployee.employer_details} />
                  <DetailRow label="Income From Other" value={selectedEmployee.Income_from_other} />
                  <DetailRow label="HRA/80GG" value={selectedEmployee.HRA_80GG} />
                  <DetailRow label="HRA Exempted" value={selectedEmployee.HRA_Exempted} />
                  <DetailRow label="A 80C" value={selectedEmployee.A_80C} />
                  <DetailRow label="A Others" value={selectedEmployee.A_Others} />
                  <DetailRow label="Standard Deduction" value={selectedEmployee.Standard_Deduction} />
                  <DetailRow label="Net Taxable Income" value={selectedEmployee.Net_taxable_income} />
                  <DetailRow label="Annual Projected TDS" value={selectedEmployee.Annual_Projected_TDS} />
                  <DetailRow label="TDS Deducted" value={selectedEmployee.TDS_deducted} />
                  <DetailRow label="Remaining Tax" value={selectedEmployee.Remaining_Tax} />
                  <DetailRow label="TDS Subsequent Month" value={selectedEmployee.TDS_subsequent_month} />
                  <DetailRow label="TDS This Month" value={selectedEmployee.TDS_this_month} />
                  <DetailRow label="Total Tax" value={selectedEmployee.Total_Tax} highlight />
                </div>

                {/* New Tax Regime */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg mb-3">New Tax Regime</h3>
                  <DetailRow label="Gross Salary" value={selectedEmployee.Gross_salary1} />
                  <DetailRow label="Salary Head" value={selectedEmployee.salary_head1} />
                  <DetailRow label="Variable Amount" value={selectedEmployee.variable_amount1} />
                  <DetailRow label="Employer Details" value={selectedEmployee.employer_details1} />
                  <DetailRow label="Income From Other" value={selectedEmployee.Income_from_other1} />
                  <DetailRow label="Chapter VI A - Others(I)" value={selectedEmployee.A_Others1} />
                  <DetailRow label="Standard Deduction(J)" value={selectedEmployee.Standard_Deduction1} />
                  <DetailRow label="Net taxable income(K)" value={selectedEmployee.Net_taxable_income1} />
                  <DetailRow label="Annual Projected TDS(L)" value={selectedEmployee.Annual_Projected_TDS1} />
                  <DetailRow label="TDS deducted till date(M)" value={selectedEmployee.TDS_deducted1} />
                  <DetailRow label="Remaining Tax(N)" value={selectedEmployee.Remaining_Tax1} />
                  <DetailRow label="TDS subsequent month(O)" value={selectedEmployee.TDS_subsequent_month1} />
                  <DetailRow label="TDS this month(P)" value={selectedEmployee.TDS_this_month1} />
                  <DetailRow label="Total Tax (New)" value={selectedEmployee.Total_Tax1} highlight />
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function DetailRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`flex justify-between py-2 border-b ${highlight ? 'bg-muted/50 font-semibold' : ''}`}>
      <span className="text-sm text-muted-foreground">{label}:</span>
      <span className="text-sm font-medium">{value || '-'}</span>
    </div>
  );
}
