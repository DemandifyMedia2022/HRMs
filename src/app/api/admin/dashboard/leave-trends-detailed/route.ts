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

    // Get all leaves for the year with their approval status
    const rows = await (prisma as any).leavedata.findMany({
      where: {
        start_date: { lte: to },
        end_date: { gte: from }
      },
      select: { 
        leave_type: true, 
        start_date: true, 
        end_date: true,
        HRapproval: true,
        Managerapproval: true,
        status: true
      }
    });

    // Initialize monthly data structure
    const months: { [k: number]: {
      approved: Record<string, number>;
      pending: Record<string, number>;
      rejected: Record<string, number>;
    } } = {};
    
    for (let m = 0; m < 12; m++) {
      months[m] = {
        approved: {},
        pending: {},
        rejected: {}
      };
    }

    // Process each leave record
    for (const r of rows) {
      const s = new Date((r as any).start_date);
      const e = new Date((r as any).end_date);
      const start = s < from ? from : s;
      const end = e > to ? to : e;
      const leaveType = String((r as any).leave_type ?? 'Unknown');
      
      // Determine approval status
      const hrApproval = String((r as any).HRapproval || '').toLowerCase();
      const mgrApproval = String((r as any).Managerapproval || '').toLowerCase();
      const status = String((r as any).status || '').toLowerCase();
      
      let approvalCategory: 'approved' | 'pending' | 'rejected';
      
      if (
        (hrApproval.includes('approved') && mgrApproval.includes('approved')) ||
        status.includes('approved')
      ) {
        approvalCategory = 'approved';
      } else if (
        hrApproval.includes('rejected') || 
        mgrApproval.includes('rejected') ||
        status.includes('rejected')
      ) {
        approvalCategory = 'rejected';
      } else {
        approvalCategory = 'pending';
      }
      
      // Count days for each month the leave spans
      const cur = new Date(start);
      while (cur <= end) {
        const m = cur.getMonth();
        
        if (!months[m][approvalCategory][leaveType]) {
          months[m][approvalCategory][leaveType] = 0;
        }
        months[m][approvalCategory][leaveType]++;
        
        cur.setDate(cur.getDate() + 1);
      }
    }

    // Format data for chart consumption
    const items = Array.from({ length: 12 }, (_, m) => {
      const monthData = months[m];
      
      const approvedTypes = Object.entries(monthData.approved).map(([type, count]) => ({ 
        type: `${type} (Approved)`, 
        count,
        category: 'approved'
      }));
      
      const pendingTypes = Object.entries(monthData.pending).map(([type, count]) => ({ 
        type: `${type} (Pending)`, 
        count,
        category: 'pending'
      }));
      
      const rejectedTypes = Object.entries(monthData.rejected).map(([type, count]) => ({ 
        type: `${type} (Rejected)`, 
        count,
        category: 'rejected'
      }));
      
      return { 
        month: m, 
        types: [...approvedTypes, ...pendingTypes, ...rejectedTypes],
        summary: {
          approved: Object.values(monthData.approved).reduce((sum, count) => sum + count, 0),
          pending: Object.values(monthData.pending).reduce((sum, count) => sum + count, 0),
          rejected: Object.values(monthData.rejected).reduce((sum, count) => sum + count, 0)
        }
      };
    });

    return NextResponse.json({ 
      year, 
      items,
      totals: {
        approved: items.reduce((sum, item) => sum + item.summary.approved, 0),
        pending: items.reduce((sum, item) => sum + item.summary.pending, 0),
        rejected: items.reduce((sum, item) => sum + item.summary.rejected, 0)
      }
    }, { 
      headers: { 'Cache-Control': 'public, max-age=120' } 
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'error' }, { status: 500 });
  }
}