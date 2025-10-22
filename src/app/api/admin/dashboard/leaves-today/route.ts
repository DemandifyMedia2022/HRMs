import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function startOfDay(d = new Date()) { const x = new Date(d); x.setUTCHours(0,0,0,0); return x; }
function endOfDay(d = new Date()) { const x = new Date(d); x.setUTCHours(23,59,59,999); return x; }

export async function GET(req: NextRequest) {
  try {
    const todayStart = startOfDay();
    const todayEnd = endOfDay();
    const rows = await (prisma as any).leavedata.findMany({
      where: {
        start_date: { lte: todayEnd },
        end_date: { gte: todayStart },
        OR: [
          { status: { equals: "Approved" } },
          { HRapproval: { equals: "Approved" }, Managerapproval: { equals: "Approved" } },
        ],
      },
      select: { leave_type: true },
    });
    const total = rows.length;
    const byType: Record<string, number> = {};
    for (const r of rows) {
      const t = String((r as any).leave_type ?? "Unknown");
      byType[t] = (byType[t] || 0) + 1;
    }
    const items = Object.entries(byType).map(([type, count]) => ({ type, count })).sort((a,b)=>b.count-a.count);
    return NextResponse.json({ total, items }, { headers: { "Cache-Control": "no-store" } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "error" }, { status: 500 });
  }
}
