import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function yStartEnd(year: number) {
  return { from: new Date(year, 0, 1, 0, 0, 0, 0), to: new Date(year, 11, 31, 23, 59, 59, 999) };
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const year = Number(url.searchParams.get('year') || new Date().getFullYear());
    const includePending = url.searchParams.get('include_pending') === 'true';
    const { from, to } = yStartEnd(year);

    let whereClause: any = {
      start_date: { lte: to },
      end_date: { gte: from }
    };

    if (!includePending) {
      // Original behavior - only approved leaves
      whereClause.OR = [
        { status: { equals: 'Approved' } },
        { HRapproval: { equals: 'Approved' }, Managerapproval: { equals: 'Approved' } }
      ];
    }
    // If includePending is true, we get all leaves regardless of approval status

    const rows = await (prisma as any).leavedata.findMany({
      where: whereClause,
      select: { 
        leave_type: true, 
        start_date: true, 
        end_date: true,
        HRapproval: true,
        Managerapproval: true,
        status: true
      }
    });

    const months: { [k: number]: Record<string, number> } = {};
    for (let m = 0; m < 12; m++) months[m] = {};

    for (const r of rows) {
      const s = new Date((r as any).start_date);
      const e = new Date((r as any).end_date);
      const start = s < from ? from : s;
      const end = e > to ? to : e;
      const cur = new Date(start);
      
      // Determine leave type with status if includePending is true
      let leaveTypeDisplay = String((r as any).leave_type ?? 'Unknown');
      
      if (includePending) {
        const hrApproval = String((r as any).HRapproval || '').toLowerCase();
        const mgrApproval = String((r as any).Managerapproval || '').toLowerCase();
        const status = String((r as any).status || '').toLowerCase();
        
        if (
          (hrApproval.includes('approved') && mgrApproval.includes('approved')) ||
          status.includes('approved')
        ) {
          leaveTypeDisplay += ' (Approved)';
        } else if (
          hrApproval.includes('rejected') || 
          mgrApproval.includes('rejected') ||
          status.includes('rejected')
        ) {
          leaveTypeDisplay += ' (Rejected)';
        } else {
          leaveTypeDisplay += ' (Pending)';
        }
      }
      
      while (cur <= end) {
        const m = cur.getMonth();
        months[m][leaveTypeDisplay] = (months[m][leaveTypeDisplay] || 0) + 1;
        cur.setDate(cur.getDate() + 1);
      }
    }

    const items = Array.from({ length: 12 }, (_, m) => {
      const byType = months[m];
      const types = Object.entries(byType).map(([type, count]) => ({ type, count }));
      return { month: m, types };
    });

    return NextResponse.json({ 
      year, 
      items,
      includePending,
      totalLeaves: rows.length
    }, { 
      headers: { 'Cache-Control': 'public, max-age=120' } 
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'error' }, { status: 500 });
  }
}
