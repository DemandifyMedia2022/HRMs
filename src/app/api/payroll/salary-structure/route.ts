import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// GET - Fetch logged-in user's salary structure
export async function GET(request: NextRequest) {
  try {
    const cookies = request.cookies;
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');

    let token: string | null = null;
    if (cookies.has('access_token')) {
      token = cookies.get('access_token')?.value || null;
    }
    if (!token && authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }

    if (!token) {
      return NextResponse.json({ success: false, error: 'Not authenticated. Please login.' }, { status: 401 });
    }

    let payload: any;
    try {
      payload = verifyToken(token);
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid session. Please login again.' }, { status: 401 });
    }

    const userIdNum = Number(payload.id);
    if (!userIdNum || Number.isNaN(userIdNum)) {
      return NextResponse.json({ success: false, error: 'User ID not found in session.' }, { status: 401 });
    }

    const userSalaryStructure = await (prisma as any).users.findUnique({
      where: { id: BigInt(userIdNum) },
      select: {
        id: true,
        Full_name: true,
        emp_code: true,
        job_role: true,
        salary_pay_mode: true,
        reimbursement_pay_mode: true,
        Is_employees_Aadhar_and_PAN_number_linked: true,
        PF_Number: true,
        UAN: true,
        Employee_PF_Contribution_limit: true,
        Salary_revision_month: true,
        Arrear_with_effect_from: true,
        Paygroup: true,
        CTC: true,
        Basic_Monthly_Remuneration: true,
        Basic_Annual_Remuneration: true,
        HRA_Monthly_Remuneration: true,
        HRA_Annual_Remuneration: true,
        OTHER_ALLOWANCE_Monthly_Remuneration: true,
        OTHER_ALLOWANCE_Annual_Remuneration: true,
        PF_Monthly_Contribution: true,
        PF_Annual_Contribution: true,
        Employee_Esic_Monthly: true,
        Employee_Esic_Annual: true,
        Employer_Esic_Monthly: true,
        Employer_Esic_Annual: true,
        gross_salary: true,
        netSalary: true
      }
    });

    if (!userSalaryStructure) {
      return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...userSalaryStructure,
        id: userSalaryStructure.id.toString()
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to fetch salary structure.' }, { status: 500 });
  }
}
