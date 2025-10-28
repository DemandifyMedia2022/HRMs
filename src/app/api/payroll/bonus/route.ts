import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Fetch bonus settings
export async function GET(req: NextRequest) {
  try {
    const bonus = await prisma.bonus.findMany();

    return NextResponse.json({
      success: true,
      data: bonus.length > 0 ? bonus[0] : null
    });
  } catch (error: any) {
    console.error('Error fetching bonus:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch bonus data' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Save/Update bonus settings
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Extract user_id from body or use a default
    const userId = body.user_id || 1;

    // Prepare data for upsert
    const data = {
      bonus: body.bonus || 'No',
      user_id: userId
    };

    // Check if record exists
    const existing = await prisma.bonus.findFirst({
      where: { user_id: userId }
    });

    let result;
    if (existing) {
      // Update existing record
      result = await prisma.bonus.update({
        where: { id: existing.id },
        data: data
      });
    } else {
      // Create new record
      result = await prisma.bonus.create({
        data: data
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Bonus settings saved successfully',
      data: result
    });
  } catch (error: any) {
    console.error('Error saving bonus:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to save bonus data' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
