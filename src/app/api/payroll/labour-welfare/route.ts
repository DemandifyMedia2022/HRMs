import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Fetch labour welfare fund settings
export async function GET(req: NextRequest) {
  try {
    const labour = await prisma.labour.findMany();

    return NextResponse.json({
      success: true,
      data: labour.length > 0 ? labour[0] : null
    });
  } catch (error: any) {
    console.error('Error fetching labour welfare fund:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch labour welfare fund data' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Save/Update labour welfare fund settings
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Extract user_id from body or use a default
    const userId = body.user_id || 1;

    // Prepare data for upsert
    const data = {
      LWF: body.LWF || 'No',
      User_id: userId
    };

    // Check if record exists
    const existing = await prisma.labour.findFirst({
      where: { User_id: userId }
    });

    let result;
    if (existing) {
      // Update existing record
      result = await prisma.labour.update({
        where: { id: existing.id },
        data: data
      });
    } else {
      // Create new record
      result = await prisma.labour.create({
        data: data
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Labour welfare fund settings saved successfully',
      data: result
    });
  } catch (error: any) {
    console.error('Error saving labour welfare fund:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save labour welfare fund data' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
