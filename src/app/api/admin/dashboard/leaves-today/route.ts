import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    // Determine today in IST
    const istDateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const today = new Date(istDateStr); // UTC midnight for today(IST)

    // Range for overlap: effectively looking for leaves that include 'today'
    // Since prisma stores @db.Date as UTC midnight, start_date <= today AND end_date >= today matches

    // However, if Prisma treats them as dates, we just need to compare dates. 
    // lte: todayEnd, gte: todayStart logic was fine BUT the definition of 'today' was UTC based.

    // Let's stick to comparing date objects (which represent midnight UTC).
    // If leave spans 2025-12-15 to 2025-12-16, start_date is 2025-12-15 00:00:00 UTC.
    // If today is 2025-12-15 (IST), 'today' var is 2025-12-15 00:00:00 UTC.
    // So we want start_date <= today AND end_date >= today.

    const rows = await (prisma as any).leavedata.findMany({
      where: {
        start_date: { lte: today },
        end_date: { gte: today },
        OR: [
          { status: { equals: 'Approved' } },
          { HRapproval: { equals: 'Approved' }, Managerapproval: { equals: 'Approved' } }
        ]
      },
      select: { leave_type: true }
    });

    const total = rows.length;
    const byType: Record<string, number> = {};
    for (const r of rows) {
      const t = String((r as any).leave_type ?? 'Unknown');
      byType[t] = (byType[t] || 0) + 1;
    }
    const items = Object.entries(byType)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
    return NextResponse.json({ total, items }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'error' }, { status: 500 });
  }
}
