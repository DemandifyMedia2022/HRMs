import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const id = Number(body?.id)
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

    const user = await prisma.users.findUnique({ where: { id: BigInt(id) } as any })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Map fields from users -> deleted_user_informations (normalize casing/column names)
    const payload: any = {
      prefix: user.Prefix ?? null,
      full_name: user.Full_name ?? null,
      gender: user.gender ?? null,
      emp_code: user.emp_code ?? null,
      blood_group: user.blood_group ?? null,
      nationality: user.nationality ?? null,
      joining_date: user.joining_date ?? null,
      retirement_date: user.retirement_date ?? null,
      employment_type: user.employment_type ?? null,
      employment_status: body?.employment_status ?? user.employment_status ?? null,
      company_name: user.company_name ?? null,
      business_unit: user.Business_unit ?? null,
      reporting_manager: user.reporting_manager ?? null,
      functional_manager: user.Functional_manager ?? null,
      team: user.Team ?? null,
      // dates/strings normalized where model requires Date
      dob: user.dob ? new Date(user.dob as any) : null,
      name: user.name ?? null,
      email: user.email ?? null,
      personal_email: user.Personal_Email ?? null,
      contact_no: user.contact_no ?? null,
      job_role: user.job_role ?? null,
      department: user.department ?? null,
      emp_address: user.emp_address ?? null,
      email_verified_at: user.email_verified_at ?? null,
      password: user.password ?? null,
      type: user.type ?? null,
      shift_time: user.shift_time ?? null,
      remember_token: user.remember_token ?? null,
      aadhaar_card: user.aadhaar_card ?? null,
      pan_card: user.pan_card ?? null,
      marksheet: user.marksheet ?? null,
      certifications: user.certifications ?? null,
      pay_slips: user.pay_slips ?? null,
      bank_statement: user.bank_statement ?? null,
      bankpassbook: user.bankpassbook ?? null,
      relieving_letter: user.relieving_letter ?? null,
      created_at: user.created_at ?? null,
      updated_at: user.updated_at ?? null,
      biometric_id: user.Biometric_id ?? null,
      bank_name: user.bank_name ?? null,
      ifsc_code: user.IFSC_code ?? null,
      account_no: user.Account_no ?? null,
      salary_pay_mode: user.salary_pay_mode ?? null,
      reimbursement_pay_mode: user.reimbursement_pay_mode ?? null,
      reimbursement_bank_name: user.reimbursement_bank_name ?? null,
      reimbursement_branch: user.reimbursement_branch ?? null,
      reimbursement_ifsc_code: user.reimbursement_ifsc_code ?? null,
      reimbursement_account_no: user.reimbursement_account_no ?? null,
      branch: user.branch ?? null,
      father_name: user.father_name ?? null,
      father_dob: user.father_dob ?? null,
      mother_name: user.mother_name ?? null,
      mother_dob: user.mother_dob ?? null,
      marital_status: user.marital_status ?? null,
      child_name: user.child_name ?? null,
      child_dob: user.child_dob ?? null,
      child_gender: user.child_gender ?? null,
      adhar_card_no: user.adhar_card_no ?? null,
      pan_card_no: user.pan_card_no ?? null,
      insuree_name: user.insuree_name ?? null,
      relationship: user.relationship ?? null,
      insuree_dob: user.insuree_dob ?? null,
      insuree_gender: user.insuree_gender ?? null,
      insuree_code: user.insuree_code ?? null,
      assured_sum: user.assured_sum ?? null,
      insurance_company: user.insurance_company ?? null,
      company_code: user.company_code ?? null,
      issue_date: user.issue_date ?? null,
      dependent_name: user.Dependent_name ?? null,
      dependent_relation: user.Dependent_relation ?? null,
      dependent_dob: user.Dependent_dob ?? null,
      dependent_gender: user.Dependent_gender ?? null,
      nominee_name: user.nominee_name ?? null,
      nominee_relation: user.nominee_relation ?? null,
      nominee_dob: user.nominee_dob ?? null,
      nominee_gender: user.nominee_gender ?? null,
      passport_no: user.passport_no ?? null,
      passport_expiry_date: user.passport_expiry_date ?? null,
      emergency_contact: user.emergency_contact ?? null,
      emergency_contact_name: user.emergency_contact_name ?? null,
      emergency_relation: user.emergency_relation ?? null,
      tax_regime: user.Tax_regime ?? null,
      is_employees_aadhar_and_pan_number_linked: user.Is_employees_Aadhar_and_PAN_number_linked ?? null,
      pf_number: user.PF_Number ?? null,
      uan: user.UAN ?? null,
      employee_pf_contribution_limit: user.Employee_PF_Contribution_limit as any,
      salary_revision_month: user.Salary_revision_month ? String(user.Salary_revision_month) : null,
      Arrear_with_effect_from: user.Arrear_with_effect_from ?? null,
      ctc: user.CTC as any,
      basic_monthly_remuneration: user.Basic_Monthly_Remuneration as any,
      basic_annual_remuneration: user.Basic_Annual_Remuneration as any,
      hra_monthly_remuneration: user.HRA_Monthly_Remuneration as any,
      hra_annual_remuneration: user.HRA_Annual_Remuneration as any,
      other_allowance_monthly_remuneration: user.OTHER_ALLOWANCE_Monthly_Remuneration as any,
      other_allowance_annual_remuneration: user.OTHER_ALLOWANCE_Annual_Remuneration as any,
      pf_monthly_contribution: user.PF_Monthly_Contribution as any,
      pf_annual_contribution: user.PF_Annual_Contribution as any,
      Employee_Esic_Monthly: user.Employee_Esic_Monthly != null ? String(user.Employee_Esic_Monthly) : null,
      Employee_Esic_Annual: user.Employee_Esic_Annual != null ? String(user.Employee_Esic_Annual) : null,
      Employer_Esic_Monthly: user.Employer_Esic_Monthly != null ? String(user.Employer_Esic_Monthly) : null,
      Employer_Esic_Annual: user.Employer_Esic_Annual != null ? String(user.Employer_Esic_Annual) : null,
      gross_salary: user.gross_salary as any,
      netSalary: user.netSalary as any,
      paygroup: user.Paygroup ?? null,
      remaining_leave: user.remaining_leave ?? null,
      last_leave_update: user.last_leave_update ?? null,
      paid_leave: user.paid_leave ?? null,
      sick_leave: user.sick_leave ?? null,
      advanced_salary: user.Advanced_salary as any,
      advanced_salary_date: user.advanced_salary_date ?? null,
      reimbursement_amount: user.Reimbursement_amount as any,
      months: user.months ? String(user.months) : null,
      status: user.status ? String(user.status) : null,
      // Resignation/settlement fields from body
      date_of_resignation: body?.date_of_resignation ? new Date(body.date_of_resignation) : null,
      expected_last_working_day: body?.expected_last_working_day ? new Date(body.expected_last_working_day) : null,
      date_of_relieving: body?.date_of_relieving ? new Date(body.date_of_relieving) : null,
      resignation_reason_employee: body?.resignation_reason_employee ?? null,
      resignation_reason_approver: body?.resignation_reason_approver ?? null,
      settelment_employee_other_status: body?.employee_other_status ?? null,
      employee_other_status_remarks: body?.employee_other_status_remarks ?? null,
    }

    // Remove undefined keys to satisfy Prisma validators
    Object.keys(payload).forEach((k) => {
      if (payload[k] === undefined) payload[k] = null
    })

    await prisma.deleted_user_informations.create({ data: payload })
    await prisma.users.delete({ where: { id: BigInt(id) } as any })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error("/api/hr/settlement/archive error:", e)
    const msg = typeof e?.message === "string" ? e.message : "Failed to archive user"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}