// POST - Get single employee by ID
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;
    console.log('Received ID for employee fetch:', id);

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Employee ID is required'
        },
        { status: 400 }
      );
    }

    const employeeData = await prisma.users.findUnique({
      where: { id: BigInt(id) }
    });

    if (!employeeData) {
      return NextResponse.json(
        {
          success: false,
          error: 'Employee not found'
        },
        { status: 404 }
      );
    }

    // Convert BigInt to string for JSON serialization
    const employee = {
      ...employeeData,
      id: employeeData.id.toString()
    };

    return NextResponse.json({
      success: true,
      data: employee
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// PUT - Update employee salary structure
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      salary_pay_mode,
      reimbursement_pay_mode,
      PF_Number,
      UAN,
      Employee_PF_Contribution_limit,
      Salary_revision_month,
      Arrear_with_effect_from,
      Paygroup,
      CTC,
      advanced_salary_date,
      Advanced_salary,
      Reimbursement_amount,
      Basic_Monthly_Remuneration,
      Basic_Annual_Remuneration,
      HRA_Monthly_Remuneration,
      HRA_Annual_Remuneration,
      OTHER_ALLOWANCE_Monthly_Remuneration,
      OTHER_ALLOWANCE_Annual_Remuneration,
      PF_Monthly_Contribution,
      PF_Annual_Contribution,
      Employee_Esic_Monthly,
      Employee_Esic_Annual,
      Employer_Esic_Monthly,
      Employer_Esic_Annual,
      gross_salary,
      netSalary
    } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Employee ID is required'
        },
        { status: 400 }
      );
    }

    const updatedEmployee = await prisma.users.update({
      where: { id: BigInt(id) },
      data: {
        salary_pay_mode,
        reimbursement_pay_mode,
        PF_Number,
        UAN,
        Employee_PF_Contribution_limit,
        Salary_revision_month: Salary_revision_month ? new Date(Salary_revision_month) : null,
        Arrear_with_effect_from: Arrear_with_effect_from ? new Date(Arrear_with_effect_from) : null,
        Paygroup,
        CTC,
        advanced_salary_date: advanced_salary_date ? new Date(advanced_salary_date) : null,
        Advanced_salary: Advanced_salary ? parseFloat(Advanced_salary) : null,
        Reimbursement_amount: Reimbursement_amount ? parseFloat(Reimbursement_amount) : null,
        Basic_Monthly_Remuneration,
        Basic_Annual_Remuneration,
        HRA_Monthly_Remuneration,
        HRA_Annual_Remuneration,
        OTHER_ALLOWANCE_Monthly_Remuneration,
        OTHER_ALLOWANCE_Annual_Remuneration,
        PF_Monthly_Contribution,
        PF_Annual_Contribution,
        Employee_Esic_Monthly: Employee_Esic_Monthly ? parseFloat(Employee_Esic_Monthly) : null,
        Employee_Esic_Annual: Employee_Esic_Annual ? parseFloat(Employee_Esic_Annual) : null,
        Employer_Esic_Monthly: Employer_Esic_Monthly ? parseFloat(Employer_Esic_Monthly) : null,
        Employer_Esic_Annual: Employer_Esic_Annual ? parseFloat(Employer_Esic_Annual) : null,
        gross_salary,
        netSalary,
        updated_at: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Salary structure updated successfully!',
      data: {
        ...updatedEmployee,
        id: updatedEmployee.id.toString()
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      { status: 500 }
    );
  }
}
