'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SidebarConfig } from '@/components/sidebar-config';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

type User = {
  id: string;
  Full_name: string;
  PF_Annual_Contribution: string;
};

export default function UpdateTaxEstimatorPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedUserPF, setSelectedUserPF] = useState('0');
  const { toast } = useToast();

  // Old Tax Regime States
  const [grossSalary, setGrossSalary] = useState('');
  const [salaryHead, setSalaryHead] = useState('');
  const [variableAmount, setVariableAmount] = useState('0');
  const [employerDetails, setEmployerDetails] = useState('0');
  const [incomeFromOther, setIncomeFromOther] = useState('0');
  const [hra80GG, setHra80GG] = useState('0');
  const [hraExempted, setHraExempted] = useState('0');
  const [a80C, setA80C] = useState('');
  const [aOthers, setAOthers] = useState('0');
  const [standardDeduction, setStandardDeduction] = useState('50000');
  const [netTaxableIncome, setNetTaxableIncome] = useState('');
  const [annualProjectedTDS, setAnnualProjectedTDS] = useState('');
  const [tdsDeducted, setTdsDeducted] = useState('0');
  const [remainingTax, setRemainingTax] = useState('');
  const [tdsSubsequentMonth, setTdsSubsequentMonth] = useState('');
  const [tdsThisMonth, setTdsThisMonth] = useState('');
  const [totalTax, setTotalTax] = useState('');

  // New Tax Regime States
  const [grossSalary1, setGrossSalary1] = useState('');
  const [salaryHead1, setSalaryHead1] = useState('');
  const [variableAmount1, setVariableAmount1] = useState('0');
  const [employerDetails1, setEmployerDetails1] = useState('0');
  const [incomeFromOther1, setIncomeFromOther1] = useState('0');
  const [aOthers1, setAOthers1] = useState('0');
  const [standardDeduction1, setStandardDeduction1] = useState('75000');
  const [netTaxableIncome1, setNetTaxableIncome1] = useState('');
  const [annualProjectedTDS1, setAnnualProjectedTDS1] = useState('');
  const [tdsDeducted1, setTdsDeducted1] = useState('0');
  const [remainingTax1, setRemainingTax1] = useState('');
  const [tdsSubsequentMonth1, setTdsSubsequentMonth1] = useState('');
  const [tdsThisMonth1, setTdsThisMonth1] = useState('');
  const [totalTax1, setTotalTax1] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/payroll/tax-estimator/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
      } else {
        toast({ title: 'Error', description: 'Failed to load users', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch users', variant: 'destructive' });
    }
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    const user = users.find(u => u.id === userId);
    if (user) {
      setSelectedUserPF(user.PF_Annual_Contribution);
      setA80C(user.PF_Annual_Contribution);
    }
  };

  // Old Tax Regime Calculation
  const calculateOldTaxRegime = (grossVal: string) => {
    setSalaryHead(grossVal);
    setGrossSalary(grossVal);

    const gross = parseFloat(grossVal) || 0;
    const variable = parseFloat(variableAmount) || 0;
    const employer = parseFloat(employerDetails) || 0;
    const income = parseFloat(incomeFromOther) || 0;
    const hra = parseFloat(hra80GG) || 0;
    const hraEx = parseFloat(hraExempted) || 0;
    const others = parseFloat(aOthers) || 0;
    const c80C = parseFloat(a80C) || 0;
    const stdDeduction = parseFloat(standardDeduction) || 0;

    const netIncome = gross + variable + employer + income - hra - hraEx - others - c80C - stdDeduction - 2500;
    setNetTaxableIncome(Math.round(netIncome).toString());

    let tax = 0;
    if (netIncome <= 250000) {
      tax = 0;
    } else if (netIncome <= 500000) {
      tax = (netIncome - 250000) * 0.05;
    } else if (netIncome <= 1000000) {
      tax = 250000 * 0.05 + (netIncome - 500000) * 0.2;
    } else {
      tax = 250000 * 0.05 + 500000 * 0.2 + (netIncome - 1000000) * 0.3;
    }

    if (netIncome <= 500000) {
      tax -= 12500;
      if (tax < 0) tax = 0;
    }

    const cess = tax * 0.04;
    const totalTaxVal = tax + cess;
    const annualTDS = Math.round(totalTaxVal);

    setAnnualProjectedTDS(annualTDS.toString());
    setTotalTax(annualTDS.toString());

    const tdsDeductedVal = parseFloat(tdsDeducted) || 0;
    const tdsPerMonth = Math.round((annualTDS - tdsDeductedVal) / 10);

    setTdsSubsequentMonth(tdsPerMonth.toString());
    setTdsThisMonth(tdsPerMonth.toString());

    const remaining = annualTDS - tdsPerMonth - tdsDeductedVal;
    setRemainingTax(remaining >= 0 ? remaining.toString() : '0');
  };

  // New Tax Regime Calculation
  const calculateNewTaxRegime = (grossVal: string) => {
    setSalaryHead1(grossVal);
    setGrossSalary1(grossVal);

    const gross = parseFloat(grossVal) || 0;
    const variable = parseFloat(variableAmount1) || 0;
    const employer = parseFloat(employerDetails1) || 0;
    const income = parseFloat(incomeFromOther1) || 0;
    const others = parseFloat(aOthers1) || 0;
    const stdDeduction = parseFloat(standardDeduction1) || 0;

    const netIncome = gross + variable + employer + income + others - stdDeduction;
    setNetTaxableIncome1(Math.round(netIncome).toString());

    let tax = 0;
    let annualTDS = 0;

    if (gross > 1000000) {
      if (netIncome <= 400000) {
        tax = 0;
      } else if (netIncome <= 800000) {
        tax = (netIncome - 400000) * 0.05;
      } else if (netIncome <= 1200000) {
        tax = 400000 * 0.05 + (netIncome - 800000) * 0.1;
      } else if (netIncome <= 1600000) {
        tax = 400000 * 0.05 + 400000 * 0.1 + (netIncome - 1200000) * 0.15;
      } else if (netIncome <= 2000000) {
        tax = 400000 * 0.05 + 400000 * 0.1 + 400000 * 0.15 + (netIncome - 1600000) * 0.2;
      } else if (netIncome <= 2400000) {
        tax = 400000 * 0.05 + 400000 * 0.1 + 400000 * 0.15 + 400000 * 0.2 + (netIncome - 2000000) * 0.25;
      } else {
        tax = 400000 * 0.05 + 400000 * 0.1 + 400000 * 0.15 + 400000 * 0.2 + 400000 * 0.25 + (netIncome - 2400000) * 0.3;
      }

      const cess = tax * 0.04;
      annualTDS = Math.round(tax + cess);
    }

    setAnnualProjectedTDS1(annualTDS.toString());
    setTotalTax1(annualTDS.toString());

    const monthlyTDS = Math.round(annualTDS / 12);
    setTdsSubsequentMonth1(monthlyTDS.toString());
    setTdsThisMonth1(monthlyTDS.toString());
    setTdsDeducted1((monthlyTDS * 5).toString());
    setTdsDeducted((monthlyTDS * 5).toString());
    setRemainingTax1((annualTDS - monthlyTDS * 6).toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUserId) {
      toast({ title: 'Error', description: 'Please select an employee', variant: 'destructive' });
      return;
    }

    try {
      const res = await fetch('/api/payroll/tax-estimator/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          SelectUser: selectedUserId,
          Gross_salary: grossSalary,
          salary_head: salaryHead,
          variable_amount: variableAmount,
          employer_details: employerDetails,
          Income_from_other: incomeFromOther,
          HRA_80GG: hra80GG,
          HRA_Exempted: hraExempted,
          A_80C: a80C,
          A_Others: aOthers,
          Standard_Deduction: standardDeduction,
          Net_taxable_income: netTaxableIncome,
          Annual_Projected_TDS: annualProjectedTDS,
          TDS_deducted: tdsDeducted,
          Remaining_Tax: remainingTax,
          TDS_subsequent_month: tdsSubsequentMonth,
          TDS_this_month: tdsThisMonth,
          Total_Tax: totalTax,
          Gross_salary1: grossSalary1,
          salary_head1: salaryHead1,
          variable_amount1: variableAmount1,
          employer_details1: employerDetails1,
          Income_from_other1: incomeFromOther1,
          A_Others1: aOthers1,
          Standard_Deduction1: standardDeduction1,
          Net_taxable_income1: netTaxableIncome1,
          Annual_Projected_TDS1: annualProjectedTDS1,
          TDS_deducted1: tdsDeducted1,
          Remaining_Tax1: remainingTax1,
          TDS_subsequent_month1: tdsSubsequentMonth1,
          TDS_this_month1: tdsThisMonth1,
          Total_Tax1: totalTax1
        })
      });

      const data = await res.json();
      if (data.success) {
        toast({ title: 'Success', description: 'Tax structure updated successfully!' });
      } else {
        toast({ title: 'Error', description: data.message || 'Failed to update', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to submit form', variant: 'destructive' });
    }
  };

  return (
    <>
      <SidebarConfig role="hr" />
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Update Tax Estimation</h1>
            <p className="text-muted-foreground">Update employee tax estimation details</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" asChild>
              <Link href="/pages/hr/payroll/tax-estimator">Back</Link>
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="mb-4">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="userSelect" className="font-semibold">
                    Select Employee:
                  </Label>
                  <Select value={selectedUserId} onValueChange={handleUserSelect}>
                    <SelectTrigger id="userSelect">
                      <SelectValue placeholder="Select an employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.Full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <Tabs defaultValue="old-tax" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="old-tax">Old Tax Regime</TabsTrigger>
                  <TabsTrigger value="new-tax">New Tax Regime</TabsTrigger>
                </TabsList>

                <TabsContent value="old-tax" className="mt-4">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-medium bg-muted">Particulars</th>
                          <th className="text-left p-3 font-medium bg-muted">Declared Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="p-3">Annual gross salary (A)</td>
                          <td className="p-3">
                            <Input
                              value={grossSalary}
                              onChange={e => calculateOldTaxRegime(e.target.value)}
                              placeholder="Enter gross salary"
                            />
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-3">Income from salary heads(B)</td>
                          <td className="p-3">
                            <Input value={salaryHead} onChange={e => setSalaryHead(e.target.value)} readOnly />
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-3">Variable amount(C)</td>
                          <td className="p-3">
                            <Input value={variableAmount} onChange={e => setVariableAmount(e.target.value)} />
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-3">Previous employer details(D)</td>
                          <td className="p-3">
                            <Input value={employerDetails} onChange={e => setEmployerDetails(e.target.value)} />
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-3">Income from other(E)</td>
                          <td className="p-3">
                            <Input value={incomeFromOther} onChange={e => setIncomeFromOther(e.target.value)} />
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-3">HRA/80GG(F)</td>
                          <td className="p-3">
                            <Input value={hra80GG} onChange={e => setHra80GG(e.target.value)} />
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-3">HRA Exempted(G)</td>
                          <td className="p-3">
                            <Input value={hraExempted} onChange={e => setHraExempted(e.target.value)} />
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-3">Chapter VI A - 80C(H)</td>
                          <td className="p-3">
                            <Input value={a80C} onChange={e => setA80C(e.target.value)} />
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-3">Chapter VI A - Others(I)</td>
                          <td className="p-3">
                            <Input value={aOthers} onChange={e => setAOthers(e.target.value)} />
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-3">Standard Deduction(J)</td>
                          <td className="p-3">
                            <Input value={standardDeduction} onChange={e => setStandardDeduction(e.target.value)} />
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-3">Net taxable income(K=B+C+D+E-H-I-J)</td>
                          <td className="p-3">
                            <Input value={netTaxableIncome} readOnly />
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-3">Annual Projected TDS(L)</td>
                          <td className="p-3">
                            <Input value={annualProjectedTDS} readOnly />
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-3">TDS deducted till date(M)</td>
                          <td className="p-3">
                            <Input value={tdsDeducted} onChange={e => setTdsDeducted(e.target.value)} />
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-3">Remaining Tax in subsequent months(N)</td>
                          <td className="p-3">
                            <Input value={remainingTax} readOnly />
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-3">TDS, in subsequent month(O)</td>
                          <td className="p-3">
                            <Input value={tdsSubsequentMonth} readOnly />
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-3">TDS,this month(P)</td>
                          <td className="p-3">
                            <Input value={tdsThisMonth} readOnly />
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-3 font-semibold">Total Tax (Old Tax Regime)</td>
                          <td className="p-3">
                            <Input value={totalTax} readOnly className="font-semibold" />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                <TabsContent value="new-tax" className="mt-4">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-medium bg-muted">Particulars</th>
                          <th className="text-left p-3 font-medium bg-muted">Declared Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="p-3">Annual gross salary (A)</td>
                          <td className="p-3">
                            <Input
                              value={grossSalary1}
                              onChange={e => calculateNewTaxRegime(e.target.value)}
                              placeholder="Enter gross salary"
                            />
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-3">Income from salary heads(B)</td>
                          <td className="p-3">
                            <Input value={salaryHead1} readOnly />
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-3">Variable amount(C)</td>
                          <td className="p-3">
                            <Input value={variableAmount1} onChange={e => setVariableAmount1(e.target.value)} />
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-3">Previous employer details(D)</td>
                          <td className="p-3">
                            <Input value={employerDetails1} onChange={e => setEmployerDetails1(e.target.value)} />
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-3">Income from other(E)</td>
                          <td className="p-3">
                            <Input value={incomeFromOther1} onChange={e => setIncomeFromOther1(e.target.value)} />
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-3">Chapter VI A - Others(I)</td>
                          <td className="p-3">
                            <Input value={aOthers1} onChange={e => setAOthers1(e.target.value)} />
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-3">Standard Deduction(J)</td>
                          <td className="p-3">
                            <Input value={standardDeduction1} onChange={e => setStandardDeduction1(e.target.value)} />
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-3">Net taxable income(K=B+C+D+E-H-I-J)</td>
                          <td className="p-3">
                            <Input value={netTaxableIncome1} readOnly />
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-3">Annual Projected TDS(L)</td>
                          <td className="p-3">
                            <Input value={annualProjectedTDS1} readOnly />
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-3">TDS deducted till date(M)</td>
                          <td className="p-3">
                            <Input value={tdsDeducted1} readOnly />
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-3">Remaining Tax in subsequent months(N)</td>
                          <td className="p-3">
                            <Input value={remainingTax1} readOnly />
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-3">TDS, in subsequent month(O)</td>
                          <td className="p-3">
                            <Input value={tdsSubsequentMonth1} readOnly />
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-3">TDS,this month(P)</td>
                          <td className="p-3">
                            <Input value={tdsThisMonth1} readOnly />
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-3 font-semibold">Total Tax (New Tax Regime)</td>
                          <td className="p-3">
                            <Input value={totalTax1} readOnly className="font-semibold" />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="mt-6">
                <Button type="submit" className="w-full md:w-auto">
                  Submit Tax Structure
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </>
  );
}
