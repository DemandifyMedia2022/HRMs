import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function parseMaybeDate(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date && !isNaN(val.getTime())) return val;
  const s = String(val).trim();
  // Try ISO or YYYY-MM-DD first
  let d = new Date(s);
  if (!isNaN(d.getTime())) return d;
  // Try DD/MM or MM/DD fallback by heuristics not reliable; return null
  return null;
}

function inNextDays(month: number, day: number, daysWindow: number): { hit: boolean; date: Date } {
  const now = new Date();
  const currentYear = now.getFullYear();
  // This year occurrence
  const thisYear = new Date(currentYear, month - 1, day);
  // If passed, take next year
  const target = thisYear < now ? new Date(currentYear + 1, month - 1, day) : thisYear;
  const diffMs = target.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return { hit: diffDays >= 0 && diffDays <= daysWindow, date: target };
}

function toLabel(d: Date) {
  return d.toLocaleDateString(undefined, { month: 'short', day: '2-digit' });
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const days = Math.max(1, Math.min(60, Number(url.searchParams.get('days') || 14)));
    const rows = await (prisma as any).users.findMany({
      select: { name: true, dob: true, joining_date: true }
    });

    const birthdays: { name: string; date: string }[] = [];
    const workAnniv: { name: string; date: string; years: number }[] = [];

    const now = new Date();
    for (const r of rows) {
      const name = (r as any).name || '—';
      // Birthday
      const dobStr = (r as any).dob as any;
      if (dobStr) {
        const dd = parseMaybeDate(dobStr);
        if (dd) {
          const { hit, date } = inNextDays(dd.getMonth() + 1, dd.getDate(), days);
          if (hit) birthdays.push({ name, date: toLabel(date) });
        }
      }
      // Work anniversary from joining_date (string)
      const jStr = (r as any).joining_date as any;
      if (jStr) {
        const jd = parseMaybeDate(jStr);
        if (jd) {
          const { hit, date } = inNextDays(jd.getMonth() + 1, jd.getDate(), days);
          if (hit) {
            const years = Math.max(0, now.getFullYear() - jd.getFullYear());
            workAnniv.push({ name, date: toLabel(date), years });
          }
        }
      }
    }

    birthdays.sort((a, b) => a.date.localeCompare(b.date));
    workAnniv.sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json(
      { days, birthdays, workAnniversaries: workAnniv },
      { headers: { 'Cache-Control': 'public, max-age=300' } }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'error' }, { status: 500 });
  }
}
