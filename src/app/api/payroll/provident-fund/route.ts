import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// GET - Fetch provident fund settings
export async function GET(req: NextRequest) {
  try {
    const providentFunds = await prisma.provident_fund.findMany()
    
    return NextResponse.json({
      success: true,
      data: providentFunds.length > 0 ? providentFunds[0] : null
    })
  } catch (error: any) {
    console.error("Error fetching provident fund:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch provident fund data" },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// POST - Save/Update provident fund settings
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Extract user_id from body or use a default
    const userId = body.user_id || 1

    // Prepare data for upsert
    const data = {
      pf_contribution: body.pf_contribution || null,
      employee_contribution: body.employee_contribution || null,
      pension: body.pension ? parseFloat(body.pension) : null,
      wage_limit: body.wage_limit || null,
      contribution_limit: body.contribution_limit || null,
      charges_rate: body.charges_rate ? parseFloat(body.charges_rate) : null,
      admin_charge: body.admin_charge || null,
      edli_contribution: body.edli_contribution ? parseFloat(body.edli_contribution) : null,
      edli_rate: body.edli_rate || null,
      edli_charge: body.edli_charge || null,
      perquisite_rate: body.perquisite_rate ? parseFloat(body.perquisite_rate) : null,
      exemption_limit: body.exemption_limit || null,
      hra_calc: body.hra_calc || 'No',
      pf: body.pf || null,
      admin_charge_basis: body.admin_charge_basis || null,
      admin: body.admin || null,
      gross: body.gross || null,
      process: body.process || null,
      fund: body.fund || 'No',
      vpf: body.vpf || null,
      user_id: userId
    }

    // Check if record exists
    const existing = await prisma.provident_fund.findFirst({
      where: { user_id: userId }
    })

    let result
    if (existing) {
      // Update existing record
      result = await prisma.provident_fund.update({
        where: { id: existing.id },
        data: data
      })
    } else {
      // Create new record
      result = await prisma.provident_fund.create({
        data: data
      })
    }

    return NextResponse.json({
      success: true,
      message: "Provident fund settings saved successfully",
      data: result
    })
  } catch (error: any) {
    console.error("Error saving provident fund:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save provident fund data" },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
