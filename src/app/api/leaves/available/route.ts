import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getYearBoundaries, clampDateToYear, calculateLeaveAllocation, getLeavesPolicyDescription, DEFAULT_LEAVE_POLICY } from '@/lib/leave-policy';
 
function workingDaysBetween(start: Date, end: Date): number {
  // inclusive range, exclude Sat(6)/Sun(0)
  let count = 0;
  const cur = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  const last = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
  while (cur <= last) {
    const day = cur.getUTCDay();
    if (day !== 0 && day !== 6) count++;
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return count;
}
 
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userName = searchParams.get('user_name') || searchParams.get('added_by_user');
    const yearParam = searchParams.get('year');
    
    if (!userName) {
      return NextResponse.json({ error: 'Missing user_name' }, { status: 400 });
    }
 
    // Get current year or specified year with strict no carry-forward policy
    const currentYear = yearParam ? parseInt(yearParam) : new Date().getFullYear();
    const boundaries = getYearBoundaries(currentYear, DEFAULT_LEAVE_POLICY);
    const allocation = calculateLeaveAllocation(currentYear, DEFAULT_LEAVE_POLICY);
    
    // Compute flexible match variants: if email provided, also try name tokens
    const isEmail = userName.includes('@');
    const local = isEmail ? userName.split('@')[0] : userName;
    const tokens = local.split(/[._\s]+/).filter(Boolean);

    const whereUser =
      isEmail && tokens.length > 0
        ? ({
            OR: [
              { added_by_user: userName },
              {
                AND: tokens.map((t) => ({
                  added_by_user: { contains: t } as any
                }))
              }
            ]
          } as any)
        : ({ added_by_user: userName } as any);

    // STRICT YEAR-SPECIFIC FILTERING: Only get leaves for the specified year
    const whereUserWithYear = {
      ...whereUser,
      AND: [
        { start_date: { gte: boundaries.yearStart } },
        { start_date: { lte: boundaries.yearEnd } }
      ]
    };

    // All leaves for the user in the specified year (for table display)
    const allLeaves = await prisma.leavedata.findMany({
      where: whereUserWithYear,
      orderBy: { start_date: 'desc' }
    });
    
    // Approved leaves for counting balances (ONLY current year, BOTH approvals required)
    const approvedLeaves = await prisma.leavedata.findMany({
      where: {
        ...whereUserWithYear,
        AND: [
          ...whereUserWithYear.AND,
          { HRapproval: { in: ['approved', 'Approved', 'APPROVED'] } as any },
          { Managerapproval: { in: ['approved', 'Approved', 'APPROVED'] } as any }
        ]
      },
      orderBy: { start_date: 'desc' }
    });
 
    let usedPaidLeave = 0;
    let usedSickLeave = 0;
 
    // Calculate used leaves ONLY for the current year (strict year boundaries)
    for (const leave of approvedLeaves) {
      const start = new Date(leave.start_date as any);
      const end = new Date(leave.end_date as any);
      
      // Clamp dates to current year boundaries (no cross-year calculation)
      const clampedRange = clampDateToYear(start, end, boundaries);
      
      // Only count if leave falls within the year
      if (clampedRange) {
        const days = workingDaysBetween(clampedRange.start, clampedRange.end);
        
        if (leave.leave_type === 'Paid Leave') {
          usedPaidLeave += days;
        } else if (leave.leave_type === 'Sick Leave(HalfDay)') {
          usedSickLeave += 0.5 * days;
        } else if (leave.leave_type === 'Sick Leave(FullDay)') {
          usedSickLeave += 1 * days;
        }
      }
    }
 
    // Calculate remaining leaves (fresh allocation each year - NO CARRY-FORWARD)
    const remainingPaidLeave = Math.max(0, allocation.paidLeave - usedPaidLeave);
    const remainingSickLeave = Math.max(0, allocation.sickLeave - usedSickLeave);
 
    return NextResponse.json({
      approvedLeaves,
      LeaveApprovalData: allLeaves,
      usedPaidLeave,
      usedSickLeave,
      remainingPaidLeave,
      remainingSickLeave,
      totals: { 
        totalPaidLeave: allocation.paidLeave, 
        totalSickLeave: allocation.sickLeave 
      },
      user: userName,
      year: currentYear,
      yearStart: boundaries.yearStart.toISOString(),
      yearEnd: boundaries.yearEnd.toISOString(),
      policy: {
        carryForward: DEFAULT_LEAVE_POLICY.carryForward,
        annualReset: DEFAULT_LEAVE_POLICY.annualReset,
        description: getLeavesPolicyDescription(DEFAULT_LEAVE_POLICY),
        resetDate: `January 1, ${currentYear + 1}`,
        nextYearAllocation: calculateLeaveAllocation(currentYear + 1, DEFAULT_LEAVE_POLICY)
      }
    });
  } catch (e: any) {
    const message = typeof e?.message === 'string' ? e.message : 'Failed to compute available leaves';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}