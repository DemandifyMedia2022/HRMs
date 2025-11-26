import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function PUT(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get('access_token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    let payload: any;
    try {
      payload = verifyToken(token);
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    // Get request body
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Employee ID is required' }, { status: 400 });
    }

    // Check if employee exists
    const employee = await prisma.users.findUnique({
      where: { id: BigInt(id) }
    });

    if (!employee) {
      return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 });
    }

    // Prepare update data - only include fields that are provided
    const dataToUpdate: any = {};

    // Salary structure fields (stored as strings)
    if (updateData.CTC !== undefined) dataToUpdate.CTC = String(updateData.CTC);
    if (updateData.gross_salary !== undefined) dataToUpdate.gross_salary = String(updateData.gross_salary);
    if (updateData.netSalary !== undefined) dataToUpdate.netSalary = String(updateData.netSalary);
    if (updateData.Basic_Monthly_Remuneration !== undefined) dataToUpdate.Basic_Monthly_Remuneration = String(updateData.Basic_Monthly_Remuneration);
    if (updateData.HRA_Monthly_Remuneration !== undefined) dataToUpdate.HRA_Monthly_Remuneration = String(updateData.HRA_Monthly_Remuneration);
    if (updateData.OTHER_ALLOWANCE_Monthly_Remuneration !== undefined) dataToUpdate.OTHER_ALLOWANCE_Monthly_Remuneration = String(updateData.OTHER_ALLOWANCE_Monthly_Remuneration);
    if (updateData.PF_Monthly_Contribution !== undefined) dataToUpdate.PF_Monthly_Contribution = String(updateData.PF_Monthly_Contribution);
    
    // ESIC fields (stored as integers)
    if (updateData.Employee_Esic_Monthly !== undefined) {
      const val = Number(updateData.Employee_Esic_Monthly);
      dataToUpdate.Employee_Esic_Monthly = isNaN(val) ? 0 : val;
    }
    if (updateData.Employer_Esic_Monthly !== undefined) {
      const val = Number(updateData.Employer_Esic_Monthly);
      dataToUpdate.Employer_Esic_Monthly = isNaN(val) ? 0 : val;
    }
    if (updateData.Employer_PF_Monthly_Contribution !== undefined) dataToUpdate.Employer_PF_Monthly_Contribution = String(updateData.Employer_PF_Monthly_Contribution);
    
    // Payment details
    if (updateData.salary_pay_mode !== undefined) dataToUpdate.salary_pay_mode = updateData.salary_pay_mode;
    if (updateData.reimbursement_pay_mode !== undefined) dataToUpdate.reimbursement_pay_mode = updateData.reimbursement_pay_mode;
    
    // PF details
    if (updateData.PF_Number !== undefined) dataToUpdate.PF_Number = updateData.PF_Number;
    if (updateData.UAN !== undefined) dataToUpdate.UAN = updateData.UAN;
    
    // CTC details
    if (updateData.Salary_Revision_Month !== undefined) dataToUpdate.Salary_Revision_Month = updateData.Salary_Revision_Month;
    if (updateData.Annual_with_effect_from !== undefined) dataToUpdate.Annual_with_effect_from = updateData.Annual_with_effect_from;
    if (updateData.PayGroup !== undefined) dataToUpdate.PayGroup = updateData.PayGroup;
    if (updateData.ESIC_Applicable !== undefined) dataToUpdate.ESIC_Applicable = updateData.ESIC_Applicable;

    // Update timestamp
    dataToUpdate.updated_at = new Date();

    // Perform the update
    const updatedEmployee = await prisma.users.update({
      where: { id: BigInt(id) },
      data: dataToUpdate
    });

    return NextResponse.json({
      success: true,
      message: 'Salary structure updated successfully',
      employee: {
        id: updatedEmployee.id.toString(),
        emp_code: updatedEmployee.emp_code,
        Full_name: updatedEmployee.Full_name
      }
    });

  } catch (error: any) {
    console.error('Error updating salary structure:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update salary structure',
        details: error.message
      },
      { status: 500 }
    );
  }
}
