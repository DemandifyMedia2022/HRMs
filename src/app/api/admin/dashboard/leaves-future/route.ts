import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function toYMD(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const days = Math.max(1, Math.min(60, Number(url.searchParams.get('days') || 14)));
    const from = startOfDay();
    const to = endOfDay(addDays(new Date(), days));

    const rows = await (prisma as any).leavedata.findMany({
      where: {
        start_date: { lte: to },
        end_date: { gte: from },
        OR: [
          { status: { equals: 'Approved' } },
          { HRapproval: { equals: 'Approved' }, Managerapproval: { equals: 'Approved' } }
        ]
      },
      select: { leave_type: true, start_date: true, end_date: true, emp_code: true, Team: true }
    });

    // Expand each leave into per-day buckets within window
    const byDate: Record<string, { total: number; byType: Record<string, number> }> = {};
    for (const r of rows) {
      const s = new Date((r as any).start_date);
      const e = new Date((r as any).end_date);
      let cur = startOfDay(s < from ? from : s);
      const stop = endOfDay(e > to ? to : e);
      while (cur <= stop) {
        const key = toYMD(cur);
        byDate[key] = byDate[key] || { total: 0, byType: {} };
        byDate[key].total += 1;
        const type = String((r as any).leave_type ?? 'Unknown');
        byDate[key].byType[type] = (byDate[key].byType[type] || 0) + 1;
        cur = addDays(cur, 1);
      }
    }

    const items = Object.entries(byDate)
      .map(([date, v]) => ({
        date,
        total: v.total,
        types: Object.entries(v.byType).map(([type, count]) => ({ type, count }))
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({ days, items }, { headers: { 'Cache-Control': 'public, max-age=120' } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'error' }, { status: 500 });
  }
}
