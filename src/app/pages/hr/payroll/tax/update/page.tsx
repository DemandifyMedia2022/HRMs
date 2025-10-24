"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { SidebarConfig } from "@/components/sidebar-config"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
type User = { id: string; Full_name: string }

export default function UpdateTaxStructurePage() {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState("")
  const [grossInput, setGrossInput] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const [calc, setCalc] = useState({
    // Shared input
    gross: "0.00",
    // Old regime
    stdOld: "0.00",
    taxableOld: "0.00",
    totalIncomeOld: "0.00",
    ceilingOld: "0.00",
    taxOld: "0.00",
    rebateOld: "0.00",
    surchargeOld: "0.00",
    cessOld: "0.00",
    totalTaxOld: "0.00",
    // New regime
    stdNew: "0.00",
    taxableNew: "0.00",
    totalIncomeNew: "0.00",
    ceilingNew: "0.00",
    taxNew: "0.00",
    rebateNew: "0.00",
    surchargeNew: "0.00",
    cessNew: "0.00",
    totalTaxNew: "0.00",
  })

  useEffect(() => {
    fetch("/api/payroll/tax-structure/users")
      .then((r) => r.json())
      .then((d) => d.success && setUsers(d.data))
  }, [])

  const calculate = (gross: string) => {
    const g = parseFloat(gross) || 0
    const stdValueOld = g > 0 ? 50000 : 0
    const stdValueNew = g > 0 ? 50000 : 0

    // Old regime
    const taxableOld = g - stdValueOld
    const ceilingOld = Math.ceil(taxableOld / 10) * 10
    let taxOld = 0
    if (ceilingOld > 1000000) {
      taxOld = (ceilingOld - 1000000) * 0.3 + 112500
    } else if (ceilingOld > 500000) {
      taxOld = (ceilingOld - 500000) * 0.2 + 12500
    } else if (ceilingOld > 250000) {
      taxOld = (ceilingOld - 250000) * 0.05
    }
    const rebateOld = ceilingOld <= 500000 ? taxOld : 0
    let surchargeOld = 0
    if (ceilingOld > 5000000 && ceilingOld <= 10000000) {
      surchargeOld = Math.min((ceilingOld - 5000000) * 0.7, taxOld * 0.1)
    } else if (ceilingOld > 10000000 && ceilingOld <= 20000000) {
      surchargeOld = Math.min((ceilingOld - 10000000) * 0.67 + taxOld * 0.1, taxOld * 0.15)
    } else if (ceilingOld > 20000000 && ceilingOld <= 50000000) {
      surchargeOld = Math.min((ceilingOld - 20000000) * 0.655 + taxOld * 0.15, taxOld * 0.25)
    } else if (ceilingOld > 50000000) {
      surchargeOld = Math.min((ceilingOld - 50000000) * 0.625 + taxOld * 0.25, taxOld * 0.37)
    }
    surchargeOld = Math.round(surchargeOld)
    const cessOld = Math.round((taxOld - rebateOld + surchargeOld) * 0.04)
    const totalTaxOld = taxOld - rebateOld + surchargeOld + cessOld

    // New regime
    const taxableNew = g - stdValueNew
    const ceilingNew = Math.ceil(taxableNew / 10) * 10
    let taxNew = 0
    if (ceilingNew > 1500000) taxNew = (ceilingNew - 1500000) * 0.3 + 150000
    else if (ceilingNew > 1200000) taxNew = (ceilingNew - 1200000) * 0.2 + 90000
    else if (ceilingNew > 900000) taxNew = (ceilingNew - 900000) * 0.15 + 45000
    else if (ceilingNew > 600000) taxNew = (ceilingNew - 600000) * 0.1 + 15000
    else if (ceilingNew > 300000) taxNew = (ceilingNew - 300000) * 0.05
    const rebateNew = ceilingNew <= 700000 ? taxNew : 0
    let surchargeNew = 0
    if (ceilingNew > 5000000 && ceilingNew <= 10000000)
      surchargeNew = Math.min((ceilingNew - 5000000) * 0.7, taxNew * 0.1)
    else if (ceilingNew > 10000000 && ceilingNew <= 20000000)
      surchargeNew = Math.min((ceilingNew - 10000000) * 0.67 + taxNew * 0.1, taxNew * 0.15)
    else if (ceilingNew > 20000000 && ceilingNew <= 50000000)
      surchargeNew = Math.min((ceilingNew - 20000000) * 0.655 + taxNew * 0.15, taxNew * 0.25)
    else if (ceilingNew > 50000000)
      surchargeNew = Math.min((ceilingNew - 50000000) * 0.625 + taxNew * 0.25, taxNew * 0.37)
    surchargeNew = Math.round(surchargeNew)
    const cessNew = Math.round((taxNew - rebateNew + surchargeNew) * 0.04)
    const totalTaxNew = taxNew - rebateNew + surchargeNew + cessNew

    setCalc({
      gross: g.toFixed(2),
      // Old
      stdOld: stdValueOld.toFixed(2),
      taxableOld: taxableOld.toFixed(2),
      totalIncomeOld: taxableOld.toFixed(2),
      ceilingOld: ceilingOld.toFixed(2),
      taxOld: taxOld.toFixed(2),
      rebateOld: rebateOld.toFixed(2),
      surchargeOld: surchargeOld.toFixed(2),
      cessOld: cessOld.toFixed(2),
      totalTaxOld: totalTaxOld.toFixed(2),
      // New
      stdNew: stdValueNew.toFixed(2),
      taxableNew: taxableNew.toFixed(2),
      totalIncomeNew: taxableNew.toFixed(2),
      ceilingNew: ceilingNew.toFixed(2),
      taxNew: taxNew.toFixed(2),
      rebateNew: rebateNew.toFixed(2),
      surchargeNew: surchargeNew.toFixed(2),
      cessNew: cessNew.toFixed(2),
      totalTaxNew: totalTaxNew.toFixed(2),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) {
      toast({ title: "Error", description: "Select a user", variant: "destructive" })
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/payroll/tax-structure/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          SelectUser: selectedUser,
          Basic_salary: "0.00",
          Gross_salary: calc.gross,
          Perquisites_under_section: "0.00",
          Exempted_allowances_under_section: "0.00",
          Profession_Tax: "0.00",
          Standard_deduction: calc.stdNew,
          Total_Taxable_income: calc.taxableNew,
          Self_Occupied: "0.00",
          Rent_Received: "0.00",
          Taxes_paid: "0.00",
          Repairs: "0.00",
          Net_Rent: "0.00",
          Interest_payable: "0.00",
          Income_Loss_House_Property: "0.00",
          total_Income: calc.totalIncomeNew,
          Deductions_80C: "0.00",
          Deductions_80CCD: "0.00",
          Deductions_80CCD2: "0.00",
          Deductions_80D: "0.00",
          Deductions_80DD: "0.00",
          Deductions_80DDB: "0.00",
          Deductions_80E: "0.00",
          Deductions_80EE: "0.00",
          Deductions_80EEA: "0.00",
          Deductions_80EEB: "0.00",
          Deductions_80U: "0.00",
          Total_Deductions: "0.00",
          Total_Taxable: calc.ceilingNew,
          Tax_on_the_above: calc.taxNew,
          Rebate_uder_Sec: calc.rebateNew,
          Surcharge: calc.surchargeNew,
          Cess: calc.cessNew,
          Total_Tax_liability: calc.totalTaxNew,
        }),
      })

      const json = await res.json()
      if (json.success) {
        toast({ title: "Success", description: "Tax structure updated!" })
        setSelectedUser("")
        setGrossInput("")
        setCalc({
          gross: "0.00",
          stdOld: "0.00",
          taxableOld: "0.00",
          totalIncomeOld: "0.00",
          ceilingOld: "0.00",
          taxOld: "0.00",
          rebateOld: "0.00",
          surchargeOld: "0.00",
          cessOld: "0.00",
          totalTaxOld: "0.00",
          stdNew: "0.00",
          taxableNew: "0.00",
          totalIncomeNew: "0.00",
          ceilingNew: "0.00",
          taxNew: "0.00",
          rebateNew: "0.00",
          surchargeNew: "0.00",
          cessNew: "0.00",
          totalTaxNew: "0.00",
        })
      } else {
        toast({ title: "Error", description: json.message, variant: "destructive" })
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <SidebarConfig role="hr" />
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Update Tax Structure</h1>
            <p className="text-muted-foreground">Update employee tax details</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/pages/hr/payroll/tax">Back to Tax</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/pages/hr">Dashboard</Link>
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="text-center">CHOICE OF REGIME - CALCULATOR</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="userSelect" className="font-semibold">
                  Select User Name for Update data:
                </Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger id="userSelect">
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.Full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="overflow-x-auto border rounded-md">
                <table className="w-full text-sm">
                  <thead style={{ backgroundColor: "#a8c4e7" }}>
                    <tr>
                      <th className="border p-2">S.No</th>
                      <th className="border p-2">Heads of Income</th>
                      <th className="border p-2">INPUT</th>
                      <th className="border p-2">OLD REGIME</th>
                      <th className="border p-2">NEW REGIME</th>
                      <th className="border p-2">Types</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ backgroundColor: "#b7e1cd" }}>
                      <td className="border p-2 font-semibold">1</td>
                      <td className="border p-2 font-semibold text-left" colSpan={5}>
                        Income from Salary / Pension
                      </td>
                    </tr>
                    <tr>
                      <td className="border p-2"></td>
                      <td className="border p-2">Basic Salary (not considered for computation)</td>
                      <td className="border p-2 text-center">0.00</td>
                      <td className="border p-2 text-center" style={{ backgroundColor: "#fce4d6" }}>0.00</td>
                      <td className="border p-2 text-center" style={{ backgroundColor: "#fff2cc" }}>0.00</td>
                      <td className="border p-2 text-center">Input</td>
                    </tr>
                    <tr>
                      <td className="border p-2">(a)</td>
                      <td className="border p-2">Total Gross Salary</td>
                      <td className="border p-2">
                        <Input
                          type="number"
                          id="gross_input"
                          value={grossInput}
                          onChange={(e) => {
                            setGrossInput(e.target.value)
                            calculate(e.target.value)
                          }}
                          placeholder="0.00"
                          step="0.01"
                        />
                      </td>
                      <td className="border p-2" style={{ backgroundColor: "#fce4d6" }}>
                        <Input id="gross_salary_old" name="Gross_salary_old" value={calc.gross} readOnly style={{ backgroundColor: "#fce4d6" }} />
                      </td>
                      <td className="border p-2" style={{ backgroundColor: "#fff2cc" }}>
                        <Input id="gross_salary" name="Gross_salary" value={calc.gross} readOnly style={{ backgroundColor: "#fff2cc" }} />
                      </td>
                      <td className="border p-2 text-center">Input</td>
                    </tr>
                    <tr>
                      <td className="border p-2">Add</td>
                      <td className="border p-2">Perquisites under section 17(2)</td>
                      <td className="border p-2 text-center">0.00</td>
                      <td className="border p-2 text-center" style={{ backgroundColor: "#fce4d6" }}>0.00</td>
                      <td className="border p-2 text-center" style={{ backgroundColor: "#fff2cc" }}>0.00</td>
                      <td className="border p-2 text-center">Input</td>
                    </tr>
                    <tr>
                      <td className="border p-2">Less</td>
                      <td className="border p-2">Exempted allowances under section 10</td>
                      <td className="border p-2 text-center">0.00</td>
                      <td className="border p-2 text-center" style={{ backgroundColor: "#fce4d6" }}>0.00</td>
                      <td className="border p-2 text-center" style={{ backgroundColor: "#fff2cc" }}>0.00</td>
                      <td className="border p-2 text-center">Input</td>
                    </tr>
                    <tr>
                      <td className="border p-2">Less</td>
                      <td className="border p-2">Standard deduction under Section 16(ia)</td>
                      <td className="border p-2"></td>
                      <td className="border p-2" style={{ backgroundColor: "#fce4d6" }}>
                        <Input id="standard_deduction_old" name="Standard_deduction_old" value={calc.stdOld} readOnly style={{ backgroundColor: "#fce4d6" }} />
                      </td>
                      <td className="border p-2" style={{ backgroundColor: "#fff2cc" }}>
                        <Input id="standard_deduction" name="Standard_deduction" value={calc.stdNew} readOnly style={{ backgroundColor: "#fff2cc" }} />
                      </td>
                      <td className="border p-2 text-center">Auto</td>
                    </tr>
                    <tr>
                      <td className="border p-2">Less</td>
                      <td className="border p-2">Profession Tax under section 16(iii)</td>
                      <td className="border p-2 text-center">0.00</td>
                      <td className="border p-2 text-center" style={{ backgroundColor: "#fce4d6" }}>0.00</td>
                      <td className="border p-2 text-center" style={{ backgroundColor: "#fff2cc" }}>0.00</td>
                      <td className="border p-2 text-center">Input</td>
                    </tr>
                    <tr>
                      <td className="border p-2"></td>
                      <td className="border p-2 font-semibold">Total Taxable income from Salary</td>
                      <td className="border p-2"></td>
                      <td className="border p-2" style={{ backgroundColor: "#fce4d6" }}>
                        <Input id="total_taxable_old" name="Total_Taxable" value={calc.taxableOld} readOnly style={{ backgroundColor: "#fce4d6" }} />
                      </td>
                      <td className="border p-2" style={{ backgroundColor: "#fff2cc" }}>
                        <Input id="total_taxable" name="Total_Taxable_income" value={calc.taxableNew} readOnly style={{ backgroundColor: "#fff2cc" }} />
                      </td>
                      <td className="border p-2"></td>
                    </tr>

                    {/* House Property Section */}
                    <tr style={{ backgroundColor: "#b7e1cd" }}>
                      <td className="border p-2">(b)</td>
                      <td className="border p-2 font-semibold text-left" colSpan={5}>
                        Income / Loss from House Property
                      </td>
                    </tr>
                    <tr>
                      <td className="border p-2"></td>
                      <td className="border p-2">Whether property is Letout/Self Occupied</td>
                      <td className="border p-2 text-center">Letout</td>
                      <td className="border p-2" style={{ backgroundColor: "#fce4d6" }}></td>
                      <td className="border p-2 text-center" style={{ backgroundColor: "#fff2cc" }}>0.00</td>
                      <td className="border p-2 text-center">Input</td>
                    </tr>
                    <tr>
                      <td className="border p-2"></td>
                      <td className="border p-2">Rent Received, if letout</td>
                      <td className="border p-2 text-center">0.00</td>
                      <td className="border p-2 text-center" style={{ backgroundColor: "#fce4d6" }}>0.00</td>
                      <td className="border p-2 text-center" style={{ backgroundColor: "#fff2cc" }}>0.00</td>
                      <td className="border p-2 text-center">Input</td>
                    </tr>
                    <tr>
                      <td className="border p-2"></td>
                      <td className="border p-2">Taxes paid to local authorities</td>
                      <td className="border p-2 text-center">0.00</td>
                      <td className="border p-2 text-center" style={{ backgroundColor: "#fce4d6" }}>0.00</td>
                      <td className="border p-2 text-center" style={{ backgroundColor: "#fff2cc" }}>0.00</td>
                      <td className="border p-2 text-center">Input</td>
                    </tr>
                    <tr>
                      <td className="border p-2"></td>
                      <td className="border p-2">30% for Repairs</td>
                      <td className="border p-2"></td>
                      <td className="border p-2 text-center" style={{ backgroundColor: "#fce4d6" }}>0.00</td>
                      <td className="border p-2 text-center" style={{ backgroundColor: "#fff2cc" }}>0.00</td>
                      <td className="border p-2"></td>
                    </tr>
                    <tr>
                      <td className="border p-2"></td>
                      <td className="border p-2">Net Rent from House Property</td>
                      <td className="border p-2"></td>
                      <td className="border p-2 text-center" style={{ backgroundColor: "#fce4d6" }}>0.00</td>
                      <td className="border p-2 text-center" style={{ backgroundColor: "#fff2cc" }}>0.00</td>
                      <td className="border p-2"></td>
                    </tr>
                    <tr>
                      <td className="border p-2"></td>
                      <td className="border p-2">Interest payable on borrowed capital</td>
                      <td className="border p-2 text-center">0</td>
                      <td className="border p-2 text-center" style={{ backgroundColor: "#fce4d6" }}>0.00</td>
                      <td className="border p-2 text-center" style={{ backgroundColor: "#fff2cc" }}>0.00</td>
                      <td className="border p-2 text-center">Input</td>
                    </tr>
                    <tr>
                      <td className="border p-2"></td>
                      <td className="border p-2">Income / Loss from House Property</td>
                      <td className="border p-2"></td>
                      <td className="border p-2 text-center" style={{ backgroundColor: "#fce4d6" }}>0.00</td>
                      <td className="border p-2 text-center" style={{ backgroundColor: "#fff2cc" }}>0.00</td>
                      <td className="border p-2"></td>
                    </tr>
                    <tr>
                      <td className="border p-2">a+b</td>
                      <td className="border p-2 font-semibold">Total Income</td>
                      <td className="border p-2"></td>
                      <td className="border p-2" style={{ backgroundColor: "#fce4d6" }}>
                        <Input id="total_income_old" name="Total" value={calc.totalIncomeOld} readOnly style={{ backgroundColor: "#fce4d6" }} />
                      </td>
                      <td className="border p-2" style={{ backgroundColor: "#fff2cc" }}>
                        <Input id="total_income" name="total_Income" value={calc.totalIncomeNew} readOnly style={{ backgroundColor: "#fff2cc" }} />
                      </td>
                      <td className="border p-2"></td>
                    </tr>

                    {/* Deductions Section */}
                    <tr>
                      <td className="border p-2"></td>
                      <td className="border p-2">Deductions under section 80C</td>
                      <td className="border p-2 text-center">0</td>
                      <td className="border p-2 text-center" style={{ backgroundColor: "#fce4d6" }}>0.00</td>
                      <td className="border p-2 text-center" style={{ backgroundColor: "#fff2cc" }}>0.00</td>
                      <td className="border p-2 text-center">Input</td>
                    </tr>
                    <tr>
                      <td className="border p-2"></td>
                      <td className="border p-2">Deductions under section 80CCD(1B)</td>
                      <td className="border p-2 text-center">0</td>
                      <td className="border p-2 text-center" style={{ backgroundColor: "#fce4d6" }}>0.00</td>
                      <td className="border p-2 text-center" style={{ backgroundColor: "#fff2cc" }}>0.00</td>
                      <td className="border p-2 text-center">Input</td>
                    </tr>
                    <tr>
                      <td className="border p-2"></td>
                      <td className="border p-2">Deductions under section 80CCD2</td>
                      <td className="border p-2 text-center">0</td>
                      <td className="border p-2 text-center" style={{ backgroundColor: "#fce4d6" }}>0.00</td>
                      <td className="border p-2 text-center" style={{ backgroundColor: "#fff2cc" }}>0.00</td>
                      <td className="border p-2 text-center">Input</td>
                    </tr>
                    <tr>
                      <td className="border p-2"></td>
                      <td className="border p-2">Deductions under section 80D</td>
                      <td className="border p-2 text-center">0</td>
                      <td className="border p-2 text-center" style={{ backgroundColor: "#fce4d6" }}>0.00</td>
                      <td className="border p-2 text-center" style={{ backgroundColor: "#fff2cc" }}>0.00</td>
                      <td className="border p-2 text-center">Input</td>
                    </tr>
                    <tr>
                      <td className="border p-2"></td>
                      <td className="border p-2">Deductions under section 80DD</td>
                      <td className="border p-2 text-center">0</td>
                      <td className="border p-2 text-center" style={{ backgroundColor: "#fce4d6" }}>0.00</td>
                      <td className="border p-2 text-center" style={{ backgroundColor: "#fff2cc" }}>0.00</td>
                      <td className="border p-2 text-center">Input</td>
                    </tr>
                    <tr>
                      <td className="border p-2"></td>
                      <td className="border p-2">Deductions under section 80DDB</td>
                      <td className="border p-2 text-center">0</td>
                      <td className="border p-2 text-center" style={{ backgroundColor: "#fce4d6" }}>0.00</td>
                      <td className="border p-2 text-center" style={{ backgroundColor: "#fff2cc" }}>0.00</td>
                      <td className="border p-2 text-center">Input</td>
                    </tr>
                    <tr>
                      <td className="border p-2"></td>
                      <td className="border p-2">Deductions under section 80E, restricted to 3 lakhs</td>
                      <td className="border p-2 text-center">0</td>
                      <td className="border p-2 text-center" style={{ backgroundColor: "#fce4d6" }}>0.00</td>
                      <td className="border p-2 text-center" style={{ backgroundColor: "#fff2cc" }}>0.00</td>
                      <td className="border p-2 text-center">Input</td>
                    </tr>
                    <tr>
                      <td className="border p-2"></td>
                      <td className="border p-2">Deductions under section 80EE</td>
                      <td className="border p-2 text-center">0</td>
                      <td className="border p-2 text-center" style={{ backgroundColor: "#fce4d6" }}>0.00</td>
                      <td className="border p-2 text-center" style={{ backgroundColor: "#fff2cc" }}>0.00</td>
                      <td className="border p-2 text-center">Input</td>
                    </tr>
                    <tr>
                      <td className="border p-2"></td>
                      <td className="border p-2">Deductions under section 80EEA</td>
                      <td className="border p-2 text-center">0</td>
                      <td className="border p-2 text-center" style={{ backgroundColor: "#fce4d6" }}>0.00</td>
                      <td className="border p-2 text-center" style={{ backgroundColor: "#fff2cc" }}>0.00</td>
                      <td className="border p-2 text-center">Input</td>
                    </tr>
                    <tr>
                      <td className="border p-2"></td>
                      <td className="border p-2">Deductions under section 80EEB</td>
                      <td className="border p-2 text-center">0</td>
                      <td className="border p-2 text-center" style={{ backgroundColor: "#fce4d6" }}>0.00</td>
                      <td className="border p-2 text-center" style={{ backgroundColor: "#fff2cc" }}>0.00</td>
                      <td className="border p-2 text-center">Input</td>
                    </tr>
                    <tr>
                      <td className="border p-2"></td>
                      <td className="border p-2">Deductions under section 80U</td>
                      <td className="border p-2 text-center">0</td>
                      <td className="border p-2 text-center" style={{ backgroundColor: "#fce4d6" }}>0.00</td>
                      <td className="border p-2 text-center" style={{ backgroundColor: "#fff2cc" }}>0.00</td>
                      <td className="border p-2 text-center">Input</td>
                    </tr>
                    <tr>
                      <td className="border p-2">||</td>
                      <td className="border p-2 font-semibold">Total Deductions from taxable income</td>
                      <td className="border p-2"></td>
                      <td className="border p-2 text-center" style={{ backgroundColor: "#fce4d6" }}>0.00</td>
                      <td className="border p-2 text-center" style={{ backgroundColor: "#fff2cc" }}>0.00</td>
                      <td className="border p-2"></td>
                    </tr>
                    <tr>
                      <td className="border p-2">|||</td>
                      <td className="border p-2 font-semibold">Total Taxable Income</td>
                      <td className="border p-2"></td>
                      <td className="border p-2" style={{ backgroundColor: "#fce4d6" }}>
                        <Input id="ceiling_taxable_old" name="Total_Taxable_old" value={calc.ceilingOld} readOnly style={{ backgroundColor: "#fce4d6" }} />
                      </td>
                      <td className="border p-2" style={{ backgroundColor: "#fff2cc" }}>
                        <Input id="ceiling_taxable_new" name="Total_Taxable" value={calc.ceilingNew} readOnly style={{ backgroundColor: "#fff2cc" }} />
                      </td>
                      <td className="border p-2"></td>
                    </tr>
                    <tr>
                      <td className="border p-2"></td>
                      <td className="border p-2">Tax on the above</td>
                      <td className="border p-2"></td>
                      <td className="border p-2" style={{ backgroundColor: "#fce4d6" }}>
                        <Input id="tax_old" name="Tax" value={calc.taxOld} readOnly style={{ backgroundColor: "#fce4d6" }} />
                      </td>
                      <td className="border p-2" style={{ backgroundColor: "#fff2cc" }}>
                        <Input id="tax_new" name="Tax_on_the_above" value={calc.taxNew} readOnly style={{ backgroundColor: "#fff2cc" }} />
                      </td>
                      <td className="border p-2"></td>
                    </tr>
                    <tr>
                      <td className="border p-2"></td>
                      <td className="border p-2">Rebate uder Sec 87A</td>
                      <td className="border p-2"></td>
                      <td className="border p-2" style={{ backgroundColor: "#fce4d6" }}>
                        <Input id="rebate_old" name="Rebate" value={calc.rebateOld} readOnly style={{ backgroundColor: "#fce4d6" }} />
                      </td>
                      <td className="border p-2" style={{ backgroundColor: "#fff2cc" }}>
                        <Input id="rebate_new" name="Rebate_uder_Sec" value={calc.rebateNew} readOnly style={{ backgroundColor: "#fff2cc" }} />
                      </td>
                      <td className="border p-2"></td>
                    </tr>
                    <tr>
                      <td className="border p-2"></td>
                      <td className="border p-2">Surcharge</td>
                      <td className="border p-2"></td>
                      <td className="border p-2" style={{ backgroundColor: "#fce4d6" }}>
                        <Input id="Surcharge_old" name="Surcharge_old" value={calc.surchargeOld} readOnly style={{ backgroundColor: "#fce4d6" }} />
                      </td>
                      <td className="border p-2" style={{ backgroundColor: "#fff2cc" }}>
                        <Input id="Surcharge_new" name="Surcharge" value={calc.surchargeNew} readOnly style={{ backgroundColor: "#fff2cc" }} />
                      </td>
                      <td className="border p-2"></td>
                    </tr>
                    <tr>
                      <td className="border p-2"></td>
                      <td className="border p-2">Cess</td>
                      <td className="border p-2"></td>
                      <td className="border p-2" style={{ backgroundColor: "#fce4d6" }}>
                        <Input id="Cess_old" name="cess_old" value={calc.cessOld} readOnly style={{ backgroundColor: "#fce4d6" }} />
                      </td>
                      <td className="border p-2" style={{ backgroundColor: "#fff2cc" }}>
                        <Input id="Cess_new" name="Cess" value={calc.cessNew} readOnly style={{ backgroundColor: "#fff2cc" }} />
                      </td>
                      <td className="border p-2"></td>
                    </tr>
                    <tr>
                      <td className="border p-2"></td>
                      <td className="border p-2 font-semibold" style={{ backgroundColor: "#b7e1cd" }}>Total Tax liability</td>
                      <td className="border p-2" style={{ backgroundColor: "#b7e1cd" }}></td>
                      <td className="border p-2" style={{ backgroundColor: "#fce4d6" }}>
                        <Input id="Total_Tax_old" name="Total_Tax" value={calc.totalTaxOld} readOnly style={{ backgroundColor: "#fce4d6" }} />
                      </td>
                      <td className="border p-2" style={{ backgroundColor: "#fff2cc" }}>
                        <Input id="Total_Tax_new" name="Total_Tax_liability" value={calc.totalTaxNew} readOnly style={{ backgroundColor: "#fff2cc" }} />
                      </td>
                      <td className="border p-2"></td>
                    </tr>
                    <tr>
                      <td className="border p-2"></td>
                      <td className="border p-2">Tax Advantage</td>
                      <td className="border p-2"></td>
                      <td className="border p-2 text-center" style={{ backgroundColor: "#fce4d6" }}>Old Regime</td>
                      <td className="border p-2 text-center" style={{ backgroundColor: "#fff2cc" }}>New Regime</td>
                      <td className="border p-2"></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex justify-center">
                <Button type="submit" size="lg" disabled={submitting || !selectedUser}>
                  {submitting ? "Submitting..." : "Submit Tax Structure"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </>
  )
}
