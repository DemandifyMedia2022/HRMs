import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
 
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
    if (!userName) {
      return NextResponse.json({ error: 'Missing user_name' }, { status: 400 });
    }
 
    const Approved = 'Approved';
    const totalPaidLeave = 12;
    const totalSickLeave = 6;
 
    // all leaves for the user (for table display)
    const allLeaves = await prisma.leavedata.findMany({
      where: { added_by_user: userName },
      orderBy: { start_date: 'desc' }
    });
 
    // approved leaves for counting balances
    // Count as approved if either HR OR Manager has approved (handle common case variants)
    const approvedLeaves = await prisma.leavedata.findMany({
      where: {
        added_by_user: userName,
        OR: [
          { HRapproval: { in: ['approved', 'Approved', 'APPROVED'] } as any },
          { Managerapproval: { in: ['approved', 'Approved', 'APPROVED'] } as any }
        ]
      },
      orderBy: { start_date: 'desc' }
    });
 
    let usedPaidLeave = 0;
    let usedSickLeave = 0;
 
    for (const leave of approvedLeaves) {
      const start = new Date(leave.start_date as any);
      const end = new Date(leave.end_date as any);
      const days = workingDaysBetween(start, end);
 
      if (leave.leave_type === 'Paid Leave') {
        usedPaidLeave += days;
      } else if (leave.leave_type === 'Sick Leave(HalfDay)') {
        usedSickLeave += 0.5 * days;
      } else if (leave.leave_type === 'Sick Leave(FullDay)') {
        usedSickLeave += 1 * days;
      }
    }
 
    const remainingPaidLeave = Math.max(0, totalPaidLeave - usedPaidLeave);
    const remainingSickLeave = Math.max(0, totalSickLeave - usedSickLeave);
 
    return NextResponse.json({
      approvedLeaves,
      LeaveApprovalData: allLeaves,
      usedPaidLeave,
      usedSickLeave,
      remainingPaidLeave,
      remainingSickLeave,
      totals: { totalPaidLeave, totalSickLeave },
      user: userName
    });
  } catch (e: any) {
    const message = typeof e?.message === 'string' ? e.message : 'Failed to compute available leaves';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}