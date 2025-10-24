import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const result = await prisma.investment_declaration.findMany({
      select: {
        id: true,
        user_id: true,
        Full_name: true,
        emp_code: true,
        Gross_salary: true,
        salary_head: true,
        variable_amount: true,
        employer_details: true,
        Income_from_other: true,
        HRA_80GG: true,
        HRA_Exempted: true,
        A_80C: true,
        A_Others: true,
        Standard_Deduction: true,
        Net_taxable_income: true,
        Annual_Projected_TDS: true,
        TDS_deducted: true,
        Remaining_Tax: true,
        TDS_subsequent_month: true,
        TDS_this_month: true,
        Total_Tax: true,
        Gross_salary1: true,
        salary_head1: true,
        variable_amount1: true,
        employer_details1: true,
        Income_from_other1: true,
        A_Others1: true,
        Standard_Deduction1: true,
        Net_taxable_income1: true,
        Annual_Projected_TDS1: true,
        TDS_deducted1: true,
        Remaining_Tax1: true,
        TDS_subsequent_month1: true,
        TDS_this_month1: true,
        Total_Tax1: true,
      },
    })

    // Format the data to ensure user_id is a string
    const formattedData = result.map((item: any) => ({
      ...item,
      user_id: item.user_id?.toString() || "",
    }))

    return NextResponse.json({
      success: true,
      data: formattedData,
    })
  } catch (error: any) {
    console.error("Error fetching tax estimations:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch tax estimations",
        error: error.message,
      },
      { status: 500 }
    )
  }
}
