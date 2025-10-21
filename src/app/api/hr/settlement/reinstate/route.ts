import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function asString(v: any): string | null {
  return v === undefined || v === null ? null : String(v)
}
function asInt(v: any): number | null {
  if (v === undefined || v === null || v === "") return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}
function asDate(v: any): Date | null {
  if (!v) return null
  try {
    const d = new Date(v as any)
    return isNaN(d.getTime()) ? null : d
  } catch {
    return null
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const id = Number(body?.id)
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

    const del = await prisma.deleted_user_informations.findUnique({ where: { Deleted_User_ID: id } })
    if (!del) return NextResponse.json({ error: "Deleted user not found" }, { status: 404 })

    // Map deleted_user_informations back to users model
    const userPayload: any = {
      Prefix: asString((del as any).prefix),
      Full_name: asString((del as any).full_name),
      gender: asString((del as any).gender),
      emp_code: asString((del as any).emp_code),
      blood_group: asString((del as any).blood_group),
      nationality: asString((del as any).nationality),
      joining_date: asString((del as any).joining_date),
      retirement_date: asString((del as any).retirement_date),
      employment_type: asString((del as any).employment_type),
      employment_status: asString((del as any).employment_status),
      company_name: asString((del as any).company_name),
      Business_unit: asString((del as any).business_unit),
      reporting_manager: asString((del as any).reporting_manager),
      Functional_manager: asString((del as any).functional_manager),
      Team: asString((del as any).team),
      dob: (del as any).dob ? asString((del as any).dob) : null,
      name: asString((del as any).name),
      email: asString((del as any).email),
      Personal_Email: asString((del as any).personal_email),
      contact_no: asString((del as any).contact_no),
      job_role: asString((del as any).job_role),
      department: asString((del as any).department),
      emp_address: asString((del as any).emp_address),
      email_verified_at: asDate((del as any).email_verified_at),
      password: asString((del as any).password) || "",
      type: asString((del as any).type) || "user",
      shift_time: asString((del as any).shift_time),
      remember_token: asString((del as any).remember_token),
      aadhaar_card: asString((del as any).aadhaar_card),
      pan_card: asString((del as any).pan_card),
      marksheet: asString((del as any).marksheet),
      certifications: asString((del as any).certifications),
      pay_slips: asString((del as any).pay_slips),
      bank_statement: asString((del as any).bank_statement),
      bankpassbook: asString((del as any).bankpassbook),
      relieving_letter: asString((del as any).relieving_letter),
      created_at: asDate((del as any).created_at),
      updated_at: asDate((del as any).updated_at),
      Biometric_id: asString((del as any).biometric_id),
      bank_name: asString((del as any).bank_name),
      IFSC_code: asString((del as any).ifsc_code),
      Account_no: asString((del as any).account_no),
      salary_pay_mode: asString((del as any).salary_pay_mode),
      reimbursement_pay_mode: asString((del as any).reimbursement_pay_mode),
      reimbursement_bank_name: asString((del as any).reimbursement_bank_name),
      reimbursement_branch: asString((del as any).reimbursement_branch),
      reimbursement_ifsc_code: asString((del as any).reimbursement_ifsc_code),
      reimbursement_account_no: asString((del as any).reimbursement_account_no),
      branch: asString((del as any).branch),
      father_name: asString((del as any).father_name),
      father_dob: asDate((del as any).father_dob),
      mother_name: asString((del as any).mother_name),
      mother_dob: asDate((del as any).mother_dob),
      marital_status: asString((del as any).marital_status),
      child_name: asString((del as any).child_name),
      child_dob: asDate((del as any).child_dob),
      child_gender: asString((del as any).child_gender),
      adhar_card_no: asString((del as any).adhar_card_no),
      pan_card_no: asString((del as any).pan_card_no),
      insuree_name: asString((del as any).insuree_name),
      relationship: asString((del as any).relationship),
      insuree_dob: asDate((del as any).insuree_dob),
      insuree_gender: asString((del as any).insuree_gender),
      insuree_code: asString((del as any).insuree_code),
      assured_sum: asString((del as any).assured_sum),
      insurance_company: asString((del as any).insurance_company),
      company_code: asString((del as any).company_code),
      issue_date: asDate((del as any).issue_date),
      Dependent_name: asString((del as any).dependent_name),
      Dependent_relation: asString((del as any).dependent_relation),
      Dependent_dob: asDate((del as any).dependent_dob),
      Dependent_gender: asString((del as any).dependent_gender),
      nominee_name: asString((del as any).nominee_name),
      nominee_relation: asString((del as any).nominee_relation),
      nominee_dob: asDate((del as any).nominee_dob),
      nominee_gender: asString((del as any).nominee_gender),
      passport_no: asString((del as any).passport_no),
      passport_expiry_date: asDate((del as any).passport_expiry_date),
      emergency_contact: asString((del as any).emergency_contact),
      emergency_contact_name: asString((del as any).emergency_contact_name),
      emergency_relation: asString((del as any).emergency_relation),
      Tax_regime: asString((del as any).tax_regime),
      Is_employees_Aadhar_and_PAN_number_linked: (del as any).is_employees_aadhar_and_pan_number_linked == null ? null : String((del as any).is_employees_aadhar_and_pan_number_linked),
      PF_Number: asString((del as any).pf_number),
      UAN: asString((del as any).uan),
      Employee_PF_Contribution_limit: asString((del as any).employee_pf_contribution_limit),
      Salary_revision_month: asDate((del as any).salary_revision_month),
      Arrear_with_effect_from: asDate((del as any).Arrear_with_effect_from),
      CTC: asString((del as any).ctc),
      Basic_Monthly_Remuneration: asString((del as any).basic_monthly_remuneration),
      Basic_Annual_Remuneration: asString((del as any).basic_annual_remuneration),
      HRA_Monthly_Remuneration: asString((del as any).hra_monthly_remuneration),
      HRA_Annual_Remuneration: asString((del as any).hra_annual_remuneration),
      OTHER_ALLOWANCE_Monthly_Remuneration: asString((del as any).other_allowance_monthly_remuneration),
      OTHER_ALLOWANCE_Annual_Remuneration: asString((del as any).other_allowance_annual_remuneration),
      PF_Monthly_Contribution: asString((del as any).pf_monthly_contribution),
      PF_Annual_Contribution: asString((del as any).pf_annual_contribution),
      Employee_Esic_Monthly: asInt((del as any).Employee_Esic_Monthly),
      Employee_Esic_Annual: asInt((del as any).Employee_Esic_Annual),
      Employer_Esic_Monthly: asInt((del as any).Employer_Esic_Monthly),
      Employer_Esic_Annual: asInt((del as any).Employer_Esic_Annual),
      gross_salary: asString((del as any).gross_salary),
      netSalary: asString((del as any).netSalary),
      Paygroup: asString((del as any).paygroup),
      remaining_leave: asInt((del as any).remaining_leave),
      last_leave_update: asDate((del as any).last_leave_update),
      paid_leave: asInt((del as any).paid_leave),
      sick_leave: asInt((del as any).sick_leave),
      Advanced_salary: asInt((del as any).advanced_salary),
      advanced_salary_date: asDate((del as any).advanced_salary_date),
      Reimbursement_amount: asInt((del as any).reimbursement_amount),
      months: asInt((del as any).months),
      status: asInt((del as any).status),
    }

    // Remove explicitly settlement-only fields by not copying them (already excluded above)

    await prisma.$transaction([
      prisma.users.create({ data: userPayload as any }),
      prisma.deleted_user_informations.delete({ where: { Deleted_User_ID: id } }),
    ])

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error("/api/hr/settlement/reinstate error:", e)
    const msg = typeof e?.message === "string" ? e.message : "Failed to reinstate employee"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}