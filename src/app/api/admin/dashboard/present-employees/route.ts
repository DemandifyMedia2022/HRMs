import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    // Get total active employees (excluding terminated/inactive)
    const totalEmployees = await prisma.users.count({
      where: {
        // Assuming there's a status field or similar to filter active employees
        // Adjust this condition based on your actual schema
        NOT: {
          status: 0 // or whatever numeric value indicates inactive status
        }
      }
    });

    // Get today's attendance
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const todayAttendance = await prisma.npattendance.findMany({
      where: {
        date: todayStr
      }
    });

    // Count present employees (those with attendance records for today)
    const presentCount = todayAttendance.length;

    return NextResponse.json({
      total: totalEmployees,
      present: presentCount
    });
  } catch (e: any) {
    console.error('Error fetching present employees:', e);
    // Fallback to just using attendance-today data if attendance table doesn't exist
    try {
      const attTodayRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/dashboard/attendance-today`);
      if (attTodayRes.ok) {
        const attToday = await attTodayRes.json();
        return NextResponse.json({
          total: attToday.total || 0,
          present: attToday.present || 0
        });
      }
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch present employees' },
      { status: 500 }
    );
  }
}
