import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function parseMaybeDate(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date && !isNaN(val.getTime())) return val;
  const s = String(val).trim();
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export async function GET() {
  try {
    const rows = await (prisma as any).users.findMany({
      select: { name: true, dob: true, joining_date: true }
    });

    const today = new Date();
    const m = today.getMonth() + 1; // 1-12
    const d = today.getDate();

    const birthdays: { name: string }[] = [];
    const anniversaries: { name: string; years: number }[] = [];

    for (const r of rows as any[]) {
      const name = r.name || '—';
      const dob = parseMaybeDate(r.dob);
      if (dob && dob.getMonth() + 1 === m && dob.getDate() === d) {
        birthdays.push({ name });
      }
      const jd = parseMaybeDate(r.joining_date);
      if (jd && jd.getMonth() + 1 === m && jd.getDate() === d) {
        const years = Math.max(0, today.getFullYear() - jd.getFullYear());
        anniversaries.push({ name, years });
      }
    }

    return NextResponse.json({ birthdays, anniversaries });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'error' }, { status: 500 });
  }
}
