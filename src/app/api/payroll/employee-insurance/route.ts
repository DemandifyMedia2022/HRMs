import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createLogger } from '@/lib/logger';

const prisma = new PrismaClient();
const logger = createLogger('payroll:employee-insurance');

// GET - Fetch employee insurance settings
export async function GET(req: NextRequest) {
  try {
    const insurance = await prisma.employee_insurance.findMany();

    return NextResponse.json({
      success: true,
      data: insurance.length > 0 ? insurance[0] : null
    });
  } catch (error: any) {
    logger.error('Error fetching employee insurance', { error: error?.message });
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch employee insurance data' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Save/Update employee insurance settings
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Extract user_id from body or use a default
    const userId = body.user_id || 1;

    // Prepare data for upsert
    const data = {
      esi: body.esi || 'No',
      wage: body.wage || null,
      esi_limit: body.esi_limit || 'No',
      employer_esi: body.employer_esi || 'None',
      employee_esi: body.employee_esi || 'None',
      negative: body.negative || 'No',
      physical: body.physical || 'No',
      user_id: userId
    };

    // Check if record exists
    const existing = await prisma.employee_insurance.findFirst({
      where: { user_id: userId }
    });

    let result;
    if (existing) {
      // Update existing record
      result = await prisma.employee_insurance.update({
        where: { id: existing.id },
        data: data
      });
    } else {
      // Create new record
      result = await prisma.employee_insurance.create({
        data: data
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Employee insurance settings saved successfully',
      data: result
    });
  } catch (error: any) {
    logger.error('Error saving employee insurance', { error: error?.message });
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save employee insurance data' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
