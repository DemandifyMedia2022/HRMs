import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getYearBoundaries, DEFAULT_LEAVE_POLICY, shouldResetLeaves } from '@/lib/leave-policy';
import { verifyToken } from '@/lib/auth';

/**
 * Year-end leave reset API
 * Handles annual leave balance resets with no carry-forward policy
 */

export async function POST(req: NextRequest) {
  try {
    // Verify admin access
    const token = req.cookies.get('access_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { year, confirmReset } = body;

    if (!year || !confirmReset) {
      return NextResponse.json({ 
        error: 'Missing required parameters: year and confirmReset' 
      }, { status: 400 });
    }

    const targetYear = parseInt(year);
    const boundaries = getYearBoundaries(targetYear, DEFAULT_LEAVE_POLICY);

    // Get statistics before reset
    const statsBeforeReset = await getLeaveStatistics(targetYear - 1);

    // Simulate reset (in a real system, this might archive old data)
    const resetSummary = {
      year: targetYear,
      previousYear: targetYear - 1,
      resetDate: boundaries.yearStart.toISOString(),
      policy: {
        carryForward: DEFAULT_LEAVE_POLICY.carryForward,
        newAllocation: {
          paidLeave: DEFAULT_LEAVE_POLICY.paidLeaveAllocation,
          sickLeave: DEFAULT_LEAVE_POLICY.sickLeaveAllocation
        }
      },
      previousYearStats: statsBeforeReset,
      message: `Leave balances reset for year ${targetYear}. No carry-forward from ${targetYear - 1}.`
    };

    return NextResponse.json({
      success: true,
      resetSummary,
      timestamp: new Date().toISOString()
    });

  } catch (e: any) {
    return NextResponse.json({ 
      error: e?.message || 'Failed to process year-end reset' 
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    // Verify admin access
    const token = req.cookies.get('access_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const url = new URL(req.url);
    const year = parseInt(url.searchParams.get('year') || new Date().getFullYear().toString());

    const currentYear = new Date().getFullYear();
    const boundaries = getYearBoundaries(year, DEFAULT_LEAVE_POLICY);
    const stats = await getLeaveStatistics(year);

    return NextResponse.json({
      year,
      currentYear,
      boundaries: {
        yearStart: boundaries.yearStart.toISOString(),
        yearEnd: boundaries.yearEnd.toISOString()
      },
      policy: DEFAULT_LEAVE_POLICY,
      statistics: stats,
      canReset: year < currentYear, // Only allow reset for past years
      shouldAutoReset: shouldResetLeaves(new Date(), DEFAULT_LEAVE_POLICY),
      nextResetDate: getYearBoundaries(currentYear + 1, DEFAULT_LEAVE_POLICY).yearStart.toISOString()
    });

  } catch (e: any) {
    return NextResponse.json({ 
      error: e?.message || 'Failed to get year-end information' 
    }, { status: 500 });
  }
}

/**
 * Get leave statistics for a specific year
 */
async function getLeaveStatistics(year: number) {
  const boundaries = getYearBoundaries(year, DEFAULT_LEAVE_POLICY);

  const [totalLeaves, approvedLeaves, pendingLeaves, rejectedLeaves] = await Promise.all([
    prisma.leavedata.count({
      where: {
        start_date: { gte: boundaries.yearStart },
        start_date: { lte: boundaries.yearEnd }
      }
    }),
    prisma.leavedata.count({
      where: {
        start_date: { gte: boundaries.yearStart },
        start_date: { lte: boundaries.yearEnd },
        HRapproval: { in: ['approved', 'Approved', 'APPROVED'] },
        Managerapproval: { in: ['approved', 'Approved', 'APPROVED'] }
      }
    }),
    prisma.leavedata.count({
      where: {
        start_date: { gte: boundaries.yearStart },
        start_date: { lte: boundaries.yearEnd },
        OR: [
          { HRapproval: { in: ['pending', 'Pending', 'PENDING'] } },
          { Managerapproval: { in: ['pending', 'Pending', 'PENDING'] } }
        ]
      }
    }),
    prisma.leavedata.count({
      where: {
        start_date: { gte: boundaries.yearStart },
        start_date: { lte: boundaries.yearEnd },
        OR: [
          { HRapproval: { in: ['rejected', 'Rejected', 'REJECTED'] } },
          { Managerapproval: { in: ['rejected', 'Rejected', 'REJECTED'] } }
        ]
      }
    })
  ]);

  return {
    year,
    totalLeaves,
    approvedLeaves,
    pendingLeaves,
    rejectedLeaves,
    boundaries: {
      yearStart: boundaries.yearStart.toISOString(),
      yearEnd: boundaries.yearEnd.toISOString()
    }
  };
}