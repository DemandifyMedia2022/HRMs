import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get('date');

    // Determine target date in IST
    const getISTDate = () => {
      return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    };
    const dateStr = q || getISTDate();
    const targetDate = new Date(dateStr); // UTC midnight for that date

    // Trigger ESSL sync if requesting today's data (fire-and-forget)
    if (!q || q === getISTDate()) {
      const syncUrl = process.env.ESSL_SYNC_URL;
      if (syncUrl) {
        try {
          const controller = new AbortController();
          const timeout = Number(process.env.ESSL_SYNC_TIMEOUT_MS || 5000);
          const timeoutId = setTimeout(() => controller.abort(), timeout);

          fetch(syncUrl, {
            method: 'POST',
            signal: controller.signal,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fromDate: `${dateStr} 00:00:00`,
              toDate: 'now',
              lookbackDays: 0
            })
          }).then(() => clearTimeout(timeoutId)).catch(() => clearTimeout(timeoutId));
        } catch {
          // Ignore sync errors
        }
        // Small delay to allow fast syncs to reflect
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    // Query npattendance (primary) or fallback to attendance
    let rows = await (prisma as any).npattendance.findMany({
      where: { date: targetDate },
      select: { status: true }
    });

    if (rows.length === 0) {
      rows = await (prisma as any).attendance.findMany({
        where: { date: targetDate },
        select: { status: true }
      });
    }

    const total = rows.length;
    let present = 0,
      absent = 0;
    for (const r of rows) {
      const s = String((r as any).status || '').toLowerCase();
      if (s.includes('present')) present++;
      else if (s.includes('absent')) absent++;
    }

    return NextResponse.json({ date: dateStr, total, present, absent }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'error' }, { status: 500 });
  }
}
