import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function norm(v?: string | null) {
  return (v ?? '').toString().trim().toLowerCase();
}

export async function GET(req: NextRequest) {
  try {
    const users = await (prisma as any).users.findMany({
      select: { id: true, status: true, employment_status: true }
    });
    const total = users.length;
    let confirmed = 0;
    let probation = 0;
    for (const u of users) {
      const s1 = norm((u as any).status);
      const s2 = norm((u as any).employment_status);
      const s = s1 || s2;
      if (s.includes('confirm')) confirmed++;
      else if (s.includes('probation')) probation++;
    }
    return NextResponse.json({ total, confirmed, probation }, { headers: { 'Cache-Control': 'public, max-age=60' } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'error' }, { status: 500 });
  }
}
