import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const pageSize = Math.max(1, Math.min(50, Number(searchParams.get('pageSize') || 10)));

    const where: any = {};
    if (search) {
      where.OR = [
        { full_name: { contains: search } },
        { name: { contains: search } },
        { email: { contains: search } },
        { emp_code: { contains: search } }
      ];
    }

    const [total, rows] = await Promise.all([
      prisma.deleted_user_informations.count({ where } as any),
      prisma.deleted_user_informations.findMany({
        where: where as any,
        orderBy: { Deleted_User_ID: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          Deleted_User_ID: true,
          name: true,
          full_name: true,
          email: true,
          emp_code: true,
          job_role: true,
          department: true,
          employment_status: true,
          company_name: true,
          joining_date: true,
          date_of_resignation: true,
          expected_last_working_day: true,
          date_of_relieving: true,
          resignation_reason_employee: true,
          resignation_reason_approver: true,
          settelment_employee_other_status: true,
          employee_other_status_remarks: true,
          ctc: true,
          gross_salary: true,
          netSalary: true,
          basic_monthly_remuneration: true,
          hra_monthly_remuneration: true,
          other_allowance_monthly_remuneration: true,
          pf_monthly_contribution: true,
          Employee_Esic_Monthly: true,
          advanced_salary: true,
          reimbursement_amount: true,
          paygroup: true
        }
      })
    ]);

    const data = rows.map((r: any) => ({
      ...r,
      id: r.Deleted_User_ID,
      // Convert Decimal types to numbers/strings for JSON serialization
      ctc: r.ctc != null ? (typeof r.ctc === 'object' && 'toNumber' in r.ctc ? r.ctc.toNumber() : Number(r.ctc)) : null,
      gross_salary: r.gross_salary != null ? (typeof r.gross_salary === 'object' && 'toNumber' in r.gross_salary ? r.gross_salary.toNumber() : Number(r.gross_salary)) : null,
      netSalary: r.netSalary != null ? (typeof r.netSalary === 'object' && 'toNumber' in r.netSalary ? r.netSalary.toNumber() : Number(r.netSalary)) : null,
      basic_monthly_remuneration: r.basic_monthly_remuneration != null ? (typeof r.basic_monthly_remuneration === 'object' && 'toNumber' in r.basic_monthly_remuneration ? r.basic_monthly_remuneration.toNumber() : Number(r.basic_monthly_remuneration)) : null,
      hra_monthly_remuneration: r.hra_monthly_remuneration != null ? (typeof r.hra_monthly_remuneration === 'object' && 'toNumber' in r.hra_monthly_remuneration ? r.hra_monthly_remuneration.toNumber() : Number(r.hra_monthly_remuneration)) : null,
      other_allowance_monthly_remuneration: r.other_allowance_monthly_remuneration != null ? (typeof r.other_allowance_monthly_remuneration === 'object' && 'toNumber' in r.other_allowance_monthly_remuneration ? r.other_allowance_monthly_remuneration.toNumber() : Number(r.other_allowance_monthly_remuneration)) : null,
      pf_monthly_contribution: r.pf_monthly_contribution != null ? (typeof r.pf_monthly_contribution === 'object' && 'toNumber' in r.pf_monthly_contribution ? r.pf_monthly_contribution.toNumber() : Number(r.pf_monthly_contribution)) : null,
      advanced_salary: r.advanced_salary != null ? (typeof r.advanced_salary === 'object' && 'toNumber' in r.advanced_salary ? r.advanced_salary.toNumber() : Number(r.advanced_salary)) : null,
      reimbursement_amount: r.reimbursement_amount != null ? (typeof r.reimbursement_amount === 'object' && 'toNumber' in r.reimbursement_amount ? r.reimbursement_amount.toNumber() : Number(r.reimbursement_amount)) : null
    }));

    return NextResponse.json({
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize))
      }
    });
  } catch (e: any) {
    const msg = typeof e?.message === 'string' ? e.message : 'Failed to fetch settlement history';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
