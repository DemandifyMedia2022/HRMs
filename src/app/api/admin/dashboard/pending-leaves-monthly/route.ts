import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function yStartEnd(year: number) {
  return { from: new Date(year, 0, 1, 0, 0, 0, 0), to: new Date(year, 11, 31, 23, 59, 59, 999) };
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const year = Number(url.searchParams.get('year') || new Date().getFullYear());
    const { from, to } = yStartEnd(year);

    // Get only PENDING leaves for the year
    const rows = await (prisma as any).leavedata.findMany({
      where: {
        start_date: { lte: to },
        end_date: { gte: from },
        AND: [
          {
            OR: [
              { HRapproval: { in: ['pending', 'Pending', 'PENDING', '', null] } },
              { Managerapproval: { in: ['pending', 'Pending', 'PENDING', '', null] } }
            ]
          },
          {
            NOT: {
              AND: [
                { HRapproval: { in: ['approved', 'Approved', 'APPROVED'] } },
                { Managerapproval: { in: ['approved', 'Approved', 'APPROVED'] } }
              ]
            }
          },
          {
            NOT: {
              OR: [
                { HRapproval: { in: ['rejected', 'Rejected', 'REJECTED'] } },
                { Managerapproval: { in: ['rejected', 'Rejected', 'REJECTED'] } }
              ]
            }
          }
        ]
      },
      select: { 
        leave_type: true, 
        start_date: true, 
        end_date: true,
        HRapproval: true,
        Managerapproval: true,
        added_by_user: true,
        reason: true
      }
    });

    const months: { [k: number]: Record<string, number> } = {};
    const monthlyDetails: { [k: number]: any[] } = {};
    
    for (let m = 0; m < 12; m++) {
      months[m] = {};
      monthlyDetails[m] = [];
    }

    for (const r of rows) {
      const s = new Date((r as any).start_date);
      const e = new Date((r as any).end_date);
      const start = s < from ? from : s;
      const end = e > to ? to : e;
      const cur = new Date(start);
      
      const leaveType = String((r as any).leave_type ?? 'Unknown');
      const hrApproval = String((r as any).HRapproval || 'pending');
      const mgrApproval = String((r as any).Managerapproval || 'pending');
      
      // Determine pending status
      let pendingWith = '';
      if (hrApproval.toLowerCase().includes('pending') || !hrApproval || hrApproval === '') {
        pendingWith += 'HR ';
      }
      if (mgrApproval.toLowerCase().includes('pending') || !mgrApproval || mgrApproval === '') {
        pendingWith += 'Manager';
      }
      
      const leaveTypeWithStatus = `${leaveType} (Pending with ${pendingWith.trim()})`;
      
      while (cur <= end) {
        const m = cur.getMonth();
        months[m][leaveTypeWithStatus] = (months[m][leaveTypeWithStatus] || 0) + 1;
        
        // Add to monthly details (only once per leave, not per day)
        if (cur.getTime() === start.getTime()) {
          monthlyDetails[m].push({
            leaveType: (r as any).leave_type,
            startDate: (r as any).start_date,
            endDate: (r as any).end_date,
            requestedBy: (r as any).added_by_user,
            reason: (r as any).reason,
            hrApproval,
            mgrApproval,
            pendingWith: pendingWith.trim()
          });
        }
        
        cur.setDate(cur.getDate() + 1);
      }
    }

    const items = Array.from({ length: 12 }, (_, m) => {
      const byType = months[m];
      const types = Object.entries(byType).map(([type, count]) => ({ type, count }));
      const monthName = new Date(year, m, 1).toLocaleDateString('en-US', { month: 'long' });
      
      return { 
        month: m, 
        monthName,
        types,
        totalPending: types.reduce((sum, t) => sum + t.count, 0),
        details: monthlyDetails[m]
      };
    });

    const totalPending = items.reduce((sum, item) => sum + item.totalPending, 0);

    return NextResponse.json({ 
      year, 
      items,
      totalPending,
      summary: {
        description: "Monthly breakdown of pending leave requests",
        note: "Leaves are counted as pending if either HR or Manager approval is still required"
      }
    }, { 
      headers: { 'Cache-Control': 'public, max-age=60' } // Shorter cache for pending data
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'error' }, { status: 500 });
  }
}