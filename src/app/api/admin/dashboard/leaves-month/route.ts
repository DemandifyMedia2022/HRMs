import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    // Get first and last day of current month
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

    // Count all approved leaves for the current month
    const totalLeaves = await prisma.leavedata.count({
      where: {
        start_date: {
          gte: monthStart,
          lte: monthEnd
        },
        HRapproval: {
          in: ['approved', 'Approved', 'APPROVED']
        },
        Managerapproval: {
          in: ['approved', 'Approved', 'APPROVED']
        }
      }
    });

    return NextResponse.json({
      total: totalLeaves,
      month: monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    });
  } catch (e: any) {
    console.error('Error fetching monthly leaves:', e);
    return NextResponse.json(
      { error: 'Failed to fetch monthly leaves' },
      { status: 500 }
    );
  }
}
