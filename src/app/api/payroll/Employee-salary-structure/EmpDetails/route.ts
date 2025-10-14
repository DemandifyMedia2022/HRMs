import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
 
const prisma = new PrismaClient();
 
// GET all employees
export async function GET(request: NextRequest) {
  try {
    console.log('Fetching employees from database...');
    const employeesData = await prisma.users.findMany({
      select: {
        id: true,
        Full_name: true,
        emp_code: true,
        company_name: true,
        department: true,
        email: true,
        contact_no: true,
        job_role: true,
        joining_date: true,
        employment_type: true,
        employment_status: true,
        // Salary Details
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
        netSalary: true,
        Paygroup: true,
        // Bank Details
        bank_name: true,
        IFSC_code: true,
        Account_no: true,
        branch: true,
        salary_pay_mode: true,
        // PF Details
        PF_Number: true,
        UAN: true,
        Employee_PF_Contribution_limit: true,
        // Tax Details
        Tax_regime: true,
        pan_card_no: true,
        adhar_card_no: true,
        Is_employees_Aadhar_and_PAN_number_linked: true,
        // Other Details
        Salary_revision_month: true,
        Arrear_with_effect_from: true,
        Advanced_salary: true,
        advanced_salary_date: true,
        Reimbursement_amount: true,
      },
      orderBy: {
        Full_name: 'asc',
      },
    });
 
    console.log(`Found ${employeesData.length} employees`);
   
    // Convert BigInt to string for JSON serialization
    const employees = employeesData.map(emp => ({
      ...emp,
      id: emp.id.toString(),
    }));
 
    return NextResponse.json({
      success: true,
      data: employees,
      count: employees.length,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
 
// GET single employee by ID
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;
 
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Employee ID is required',
      }, { status: 400 });
    }
 
    const employeeData = await prisma.users.findUnique({
      where: { id: BigInt(id) },
    });
 
    if (!employeeData) {
      return NextResponse.json({
        success: false,
        error: 'Employee not found',
      }, { status: 404 });
    }
 
    // Convert BigInt to string for JSON serialization
    const employee = {
      ...employeeData,
      id: employeeData.id.toString(),
    };
 
    return NextResponse.json({
      success: true,
      data: employee,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}