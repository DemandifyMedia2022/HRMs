import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function parseYMD(ymd?: string | null): Date | null {
  if (!ymd) return null
  const m = String(ymd).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return null
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return isNaN(d.getTime()) ? null : d
}
function toYMD(d = new Date()) {
  const y = d.getFullYear(); const m = String(d.getMonth() + 1).padStart(2, "0"); const day = String(d.getDate()).padStart(2, "0"); return `${y}-${m}-${day}`
}
function startOfDayLocal(d = new Date()) { const x = new Date(d); x.setHours(0,0,0,0); return x }
function endOfDayLocal(d = new Date()) { const x = new Date(d); x.setHours(23,59,59,999); return x }

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const q = url.searchParams.get('date')
    const base = parseYMD(q) || new Date()
    const from = startOfDayLocal(base)
    const to = endOfDayLocal(base)
    const ymd = toYMD(base)

    const rows = await (prisma as any).npattendance.findMany({
      where: { date: { gte: from, lte: to } },
      select: { status: true },
    }).catch(async () => {
      return (prisma as any).attendance.findMany({
        where: { date: { gte: from, lte: to } },
        select: { status: true },
      })
    });

    const total = rows.length
    let present = 0, absent = 0
    for (const r of rows) {
      const s = String((r as any).status || "").toLowerCase()
      if (s.includes("present")) present++
      else if (s.includes("absent")) absent++
    }
    return NextResponse.json({ date: ymd, total, present, absent }, { headers: { "Cache-Control": "no-store" } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "error" }, { status: 500 });
  }
}
