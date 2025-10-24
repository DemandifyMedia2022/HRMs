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

  // Editable fields that used to be fixed
  const [perquisites, setPerquisites] = useState("0.00")
  const [exemptedAllowances, setExemptedAllowances] = useState("0.00")
  const [professionTax, setProfessionTax] = useState("0.00")

  // House property
  const [selfOccupied, setSelfOccupied] = useState("0.00")
  const [rentReceived, setRentReceived] = useState("0.00")
  const [taxesPaidLocal, setTaxesPaidLocal] = useState("0.00")
  const [repairs, setRepairs] = useState("0.00")
  const [netRent, setNetRent] = useState("0.00")
  const [interestPayable, setInterestPayable] = useState("0.00")
  const [incomeLossHouseProperty, setIncomeLossHouseProperty] = useState("0.00")

  // Deductions (80* sections)
  const [d80C, setD80C] = useState("0.00")
  const [d80CCD, setD80CCD] = useState("0.00")
  const [d80CCD2, setD80CCD2] = useState("0.00")
  const [d80D, setD80D] = useState("0.00")
  const [d80DD, setD80DD] = useState("0.00")
  const [d80DDB, setD80DDB] = useState("0.00")
  const [d80E, setD80E] = useState("0.00")
  const [d80EE, setD80EE] = useState("0.00")
  const [d80EEA, setD80EEA] = useState("0.00")
  const [d80EEB, setD80EEB] = useState("0.00")
  const [d80U, setD80U] = useState("0.00")

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
    const perq = parseFloat(perquisites) || 0
    const exempt = parseFloat(exemptedAllowances) || 0
    const profTax = parseFloat(professionTax) || 0
    const stdValueOld = g > 0 ? 50000 : 0
    const stdValueNew = g > 0 ? 50000 : 0

    // Old regime
    const taxableOld = Math.max(0, g + perq - exempt - stdValueOld - profTax)
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

    // New regime (keeping parity with inputs used above)
    const taxableNew = Math.max(0, g + perq - exempt - stdValueNew - profTax)
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
          Perquisites_under_section: perquisites,
          Exempted_allowances_under_section: exemptedAllowances,
          Profession_Tax: professionTax,
          Standard_deduction: calc.stdNew,
          Total_Taxable_income: calc.taxableNew,
          Self_Occupied: selfOccupied,
          Rent_Received: rentReceived,
          Taxes_paid: taxesPaidLocal,
          Repairs: repairs,
          Net_Rent: netRent,
          Interest_payable: interestPayable,
          Income_Loss_House_Property: incomeLossHouseProperty,
          total_Income: calc.totalIncomeNew,
          Deductions_80C: d80C,
          Deductions_80CCD: d80CCD,
          Deductions_80CCD2: d80CCD2,
          Deductions_80D: d80D,
          Deductions_80DD: d80DD,
          Deductions_80DDB: d80DDB,
          Deductions_80E: d80E,
          Deductions_80EE: d80EE,
          Deductions_80EEA: d80EEA,
          Deductions_80EEB: d80EEB,
          Deductions_80U: d80U,
          Total_Deductions: (
            (
              parseFloat(d80C)||0
            )+(
              parseFloat(d80CCD)||0
            )+(
              parseFloat(d80CCD2)||0
            )+(
              parseFloat(d80D)||0
            )+(
              parseFloat(d80DD)||0
            )+(
              parseFloat(d80DDB)||0
            )+(
              parseFloat(d80E)||0
            )+(
              parseFloat(d80EE)||0
            )+(
              parseFloat(d80EEA)||0
            )+(
              parseFloat(d80EEB)||0
            )+(
              parseFloat(d80U)||0
            )
          ).toFixed(2),
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
        setPerquisites("0.00")
        setExemptedAllowances("0.00")
        setProfessionTax("0.00")
        setSelfOccupied("0.00")
        setRentReceived("0.00")
        setTaxesPaidLocal("0.00")
        setRepairs("0.00")
        setNetRent("0.00")
        setInterestPayable("0.00")
        setIncomeLossHouseProperty("0.00")
        setD80C("0.00")
        setD80CCD("0.00")
        setD80CCD2("0.00")
        setD80D("0.00")
        setD80DD("0.00")
        setD80DDB("0.00")
        setD80E("0.00")
        setD80EE("0.00")
        setD80EEA("0.00")
        setD80EEB("0.00")
        setD80U("0.00")
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
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Update Tax Structure</h1>
            <p className="text-muted-foreground">Update employee tax details</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/pages/hr/payroll/tax">Back</Link>
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardContent className="space-y-8">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="userSelect" className="font-semibold">
                      Select User
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

                  <div className="space-y-2">
                    <Label htmlFor="gross_input" className="font-semibold">Total Gross Salary</Label>
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
                    <p className="text-xs text-muted-foreground">Enter annual gross amount. Calculations update instantly.</p>
                  </div>

                  {/* Advanced editable inputs */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Advanced Inputs</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="perquisites">Perquisites (Sec 17(2))</Label>
                        <Input id="perquisites" type="number" value={perquisites} onChange={(e)=>{ setPerquisites(e.target.value); calculate(grossInput); }} step="0.01" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="exempted">Exempted allowances (Sec 10)</Label>
                        <Input id="exempted" type="number" value={exemptedAllowances} onChange={(e)=>{ setExemptedAllowances(e.target.value); calculate(grossInput); }} step="0.01" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="professionTax">Profession Tax (Sec 16(iii))</Label>
                        <Input id="professionTax" type="number" value={professionTax} onChange={(e)=>{ setProfessionTax(e.target.value); calculate(grossInput); }} step="0.01" />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="selfOccupied">Self Occupied</Label>
                          <Input id="selfOccupied" type="number" value={selfOccupied} onChange={(e)=> setSelfOccupied(e.target.value)} step="0.01" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="rentReceived">Rent Received</Label>
                          <Input id="rentReceived" type="number" value={rentReceived} onChange={(e)=> setRentReceived(e.target.value)} step="0.01" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="taxesPaidLocal">Taxes paid (Local)</Label>
                          <Input id="taxesPaidLocal" type="number" value={taxesPaidLocal} onChange={(e)=> setTaxesPaidLocal(e.target.value)} step="0.01" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="repairs">Repairs</Label>
                          <Input id="repairs" type="number" value={repairs} onChange={(e)=> setRepairs(e.target.value)} step="0.01" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="netRent">Net Rent</Label>
                          <Input id="netRent" type="number" value={netRent} onChange={(e)=> setNetRent(e.target.value)} step="0.01" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="interestPayable">Interest payable</Label>
                          <Input id="interestPayable" type="number" value={interestPayable} onChange={(e)=> setInterestPayable(e.target.value)} step="0.01" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="incomeLossHP">Income/Loss House Property</Label>
                          <Input id="incomeLossHP" type="number" value={incomeLossHouseProperty} onChange={(e)=> setIncomeLossHouseProperty(e.target.value)} step="0.01" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="d80C">80C</Label>
                          <Input id="d80C" type="number" value={d80C} onChange={(e)=> setD80C(e.target.value)} step="0.01" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="d80CCD">80CCD(1B)</Label>
                          <Input id="d80CCD" type="number" value={d80CCD} onChange={(e)=> setD80CCD(e.target.value)} step="0.01" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="d80CCD2">80CCD2</Label>
                          <Input id="d80CCD2" type="number" value={d80CCD2} onChange={(e)=> setD80CCD2(e.target.value)} step="0.01" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="d80D">80D</Label>
                          <Input id="d80D" type="number" value={d80D} onChange={(e)=> setD80D(e.target.value)} step="0.01" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="d80DD">80DD</Label>
                          <Input id="d80DD" type="number" value={d80DD} onChange={(e)=> setD80DD(e.target.value)} step="0.01" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="d80DDB">80DDB</Label>
                          <Input id="d80DDB" type="number" value={d80DDB} onChange={(e)=> setD80DDB(e.target.value)} step="0.01" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="d80E">80E</Label>
                          <Input id="d80E" type="number" value={d80E} onChange={(e)=> setD80E(e.target.value)} step="0.01" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="d80EE">80EE</Label>
                          <Input id="d80EE" type="number" value={d80EE} onChange={(e)=> setD80EE(e.target.value)} step="0.01" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="d80EEA">80EEA</Label>
                          <Input id="d80EEA" type="number" value={d80EEA} onChange={(e)=> setD80EEA(e.target.value)} step="0.01" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="d80EEB">80EEB</Label>
                          <Input id="d80EEB" type="number" value={d80EEB} onChange={(e)=> setD80EEB(e.target.value)} step="0.01" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="d80U">80U</Label>
                          <Input id="d80U" type="number" value={d80U} onChange={(e)=> setD80U(e.target.value)} step="0.01" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Quick Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Gross</p>
                        <p className="font-medium">₹{Number(calc.gross || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Best Regime</p>
                        <p className="font-medium">{Number(calc.totalTaxOld) <= Number(calc.totalTaxNew) ? "Old" : "New"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Old Total Tax</p>
                        <p className="font-medium">₹{Number(calc.totalTaxOld || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">New Total Tax</p>
                        <p className="font-medium">₹{Number(calc.totalTaxNew || 0).toLocaleString()}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Old Regime</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Standard deduction</span>
                      <span>₹{Number(calc.stdOld || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Taxable income</span>
                      <span>₹{Number(calc.taxableOld || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Tax on above</span>
                      <span>₹{Number(calc.taxOld || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Rebate</span>
                      <span>₹{Number(calc.rebateOld || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Surcharge</span>
                      <span>₹{Number(calc.surchargeOld || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Cess</span>
                      <span>₹{Number(calc.cessOld || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between border-t pt-3 font-semibold">
                      <span>Total tax liability</span>
                      <span>₹{Number(calc.totalTaxOld || 0).toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">New Regime</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Standard deduction</span>
                      <span>₹{Number(calc.stdNew || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Taxable income</span>
                      <span>₹{Number(calc.taxableNew || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Tax on above</span>
                      <span>₹{Number(calc.taxNew || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Rebate</span>
                      <span>₹{Number(calc.rebateNew || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Surcharge</span>
                      <span>₹{Number(calc.surchargeNew || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Cess</span>
                      <span>₹{Number(calc.cessNew || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between border-t pt-3 font-semibold">
                      <span>Total tax liability</span>
                      <span>₹{Number(calc.totalTaxNew || 0).toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>
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

