import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Fetch professional tax settings
export async function GET(req: NextRequest) {
  try {
    const professionaltax = await prisma.professionaltax.findMany();

    return NextResponse.json({
      success: true,
      data: professionaltax.length > 0 ? professionaltax[0] : null
    });
  } catch (error) {
    console.error('Error fetching professional tax:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch professional tax data' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Save/Update professional tax settings
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Extract user_id from body or use a default
    const userId = body.user_id || 1;

    // Prepare data for upsert
    const data = {
      professional_tax: body.professional_tax || 'No',
      separate: body.separate || 'No',
      disabled: body.disabled || 'No',
      exemption: body.exemption || 'No',
      exemption_limit: body.exemption_limit || null,
      user_id: userId
    };

    // Check if record exists
    const existing = await prisma.professionaltax.findFirst({
      where: { user_id: userId }
    });

    let result;
    if (existing) {
      // Update existing record
      result = await prisma.professionaltax.update({
        where: { id: existing.id },
        data: data
      });
    } else {
      // Create new record
      result = await prisma.professionaltax.create({
        data: data
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Professional tax settings saved successfully',
      data: result
    });
  } catch (error) {
    console.error('Error saving professional tax:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to save professional tax data' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
