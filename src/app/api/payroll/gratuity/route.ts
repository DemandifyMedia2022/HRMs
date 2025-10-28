import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Fetch gratuity settings
export async function GET(req: NextRequest) {
  try {
    const gratuity = await prisma.gratuity.findMany();

    return NextResponse.json({
      success: true,
      data: gratuity.length > 0 ? gratuity[0] : null
    });
  } catch (error: any) {
    console.error('Error fetching gratuity:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch gratuity data' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Save/Update gratuity settings
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Extract user_id from body or use a default
    const userId = body.user_id || 1;

    // Prepare data for upsert
    const data = {
      Gratuity: body.Gratuity || 'No',
      user_id: userId
    };

    // Check if record exists
    const existing = await prisma.gratuity.findFirst({
      where: { user_id: userId }
    });

    let result;
    if (existing) {
      // Update existing record
      result = await prisma.gratuity.update({
        where: { id: existing.id },
        data: data
      });
    } else {
      // Create new record
      result = await prisma.gratuity.create({
        data: data
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Gratuity settings saved successfully',
      data: result
    });
  } catch (error: any) {
    console.error('Error saving gratuity:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save gratuity data' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
