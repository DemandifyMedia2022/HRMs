import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function toStr(v: any) { return (v ?? "").toString(); }
function isStatus(val: any, target: string) {
  const s = toStr(val).trim().toLowerCase();
  const t = target.trim().toLowerCase();
  if (t === "pending") return s === "pending" || s === "" || s === "awaiting" || s === "inprogress";
  return s === t;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const status = (url.searchParams.get('status') || 'pending').toLowerCase(); // pending|approved|rejected
    const limit = Math.max(1, Math.min(20, Number(url.searchParams.get('limit') || 6)));

    const rows = await (prisma as any).leavedata.findMany({
      select: {
        l_id: true, leave_type: true, start_date: true, end_date: true, reason: true,
        HRapproval: true, Managerapproval: true, leaveregdate: true, added_by_user: true,
      },
      orderBy: { leaveregdate: 'desc' },
      take: 200,
    });

    const filtered = rows.filter((r: any) => isStatus(r.HRapproval, status)).slice(0, limit);

    return NextResponse.json({
      status,
      total: filtered.length,
      items: filtered.map((r: any) => ({
        id: r.l_id,
        type: r.leave_type,
        start: r.start_date,
        end: r.end_date,
        reason: r.reason,
        hrStatus: r.HRapproval,
        mgrStatus: r.Managerapproval,
        requestedBy: r.added_by_user,
        requestedOn: r.leaveregdate,
      })),
    }, { headers: { 'Cache-Control': 'public, max-age=60' } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'error' }, { status: 500 });
  }
}
