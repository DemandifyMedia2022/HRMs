import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      SelectUser,
      Gross_salary,
      salary_head,
      variable_amount,
      employer_details,
      Income_from_other,
      HRA_80GG,
      HRA_Exempted,
      A_80C,
      A_Others,
      Standard_Deduction,
      Net_taxable_income,
      Annual_Projected_TDS,
      TDS_deducted,
      Remaining_Tax,
      TDS_subsequent_month,
      TDS_this_month,
      Total_Tax,
      Gross_salary1,
      salary_head1,
      variable_amount1,
      employer_details1,
      Income_from_other1,
      A_Others1,
      Standard_Deduction1,
      Net_taxable_income1,
      Annual_Projected_TDS1,
      TDS_deducted1,
      Remaining_Tax1,
      TDS_subsequent_month1,
      TDS_this_month1,
      Total_Tax1
    } = body;

    if (!SelectUser) {
      return NextResponse.json({ success: false, message: 'User ID is required' }, { status: 400 });
    }

    const userId = parseInt(SelectUser);

    // Fetch user details
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        Full_name: true,
        emp_code: true,
        PF_Annual_Contribution: true
      }
    });

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // Prepare data for upsert
    const taxData = {
      user_id: userId,
      Full_name: user.Full_name,
      emp_code: user.emp_code,
      Gross_salary: Gross_salary || '0',
      salary_head: salary_head || '0',
      variable_amount: variable_amount || '0',
      employer_details: employer_details || '0',
      Income_from_other: Income_from_other || '0',
      HRA_80GG: HRA_80GG || '0',
      HRA_Exempted: HRA_Exempted || '0',
      A_80C: A_80C || '0',
      A_Others: A_Others || '0',
      Standard_Deduction: Standard_Deduction || '0',
      Net_taxable_income: Net_taxable_income || '0',
      Annual_Projected_TDS: Annual_Projected_TDS || '0',
      TDS_deducted: TDS_deducted || '0',
      Remaining_Tax: Remaining_Tax || '0',
      TDS_subsequent_month: TDS_subsequent_month || '0',
      TDS_this_month: TDS_this_month || '0',
      Total_Tax: Total_Tax || '0',
      Gross_salary1: Gross_salary1 || '0',
      salary_head1: salary_head1 || '0',
      variable_amount1: variable_amount1 || '0',
      employer_details1: employer_details1 || '0',
      Income_from_other1: Income_from_other1 || '0',
      A_Others1: A_Others1 || '0',
      Standard_Deduction1: Standard_Deduction1 || '0',
      Net_taxable_income1: Net_taxable_income1 || '0',
      Annual_Projected_TDS1: Annual_Projected_TDS1 || '0',
      TDS_deducted1: TDS_deducted1 || '0',
      Remaining_Tax1: Remaining_Tax1 || '0',
      TDS_subsequent_month1: TDS_subsequent_month1 || '0',
      TDS_this_month1: TDS_this_month1 || '0',
      Total_Tax1: Total_Tax1 || '0'
    };

    // Check if record exists
    const existing = await prisma.investment_declaration.findFirst({
      where: { user_id: userId }
    });

    if (existing) {
      // Update existing record
      await prisma.investment_declaration.update({
        where: { id: existing.id },
        data: taxData
      });
    } else {
      // Insert new record
      await prisma.investment_declaration.create({
        data: taxData
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Tax structure updated successfully!'
    });
  } catch (error: any) {
    console.error('Error updating tax estimation:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update tax estimation',
        error: error.message
      },
      { status: 500 }
    );
  }
}
