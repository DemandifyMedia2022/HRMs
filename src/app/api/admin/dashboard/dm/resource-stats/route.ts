export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/logger';

const logger = createLogger('admin:resource-stats');

export async function GET() {
  try {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = now.getMonth() + 1;
    const yyyyMmDd = now.toISOString().slice(0, 10); // YYYY-MM-DD

    // Get all resource names seen in the current month
    const namesRows = await prisma.$queryRaw<any[]>`
      SELECT DISTINCT f_resource_name AS resource_name
      FROM dm_form
      WHERE YEAR(f_date) = ${yyyy} 
        AND MONTH(f_date) = ${mm} 
        AND f_resource_name IS NOT NULL 
        AND TRIM(f_resource_name) <> ''
    `;

    // Monthly counts
    const monthlyRows = await prisma.$queryRaw<any[]>`
      SELECT f_resource_name AS resource_name, COUNT(*) AS total
      FROM dm_form
      WHERE MONTH(f_date) = ${mm} AND YEAR(f_date) = ${yyyy}
      GROUP BY f_resource_name
    `;

    // Daily counts (today)
    const dailyRows = await prisma.$queryRaw<any[]>`
      SELECT f_resource_name AS resource_name, COUNT(*) AS total
      FROM dm_form
      WHERE DATE(f_date) = ${yyyyMmDd}
      GROUP BY f_resource_name
    `;

    // Build maps for quick lookup
    const monthlyMap = new Map<string, number>();
    for (const r of monthlyRows) monthlyMap.set(r.resource_name, Number(r.total));
    const dailyMap = new Map<string, number>();
    for (const r of dailyRows) dailyMap.set(r.resource_name, Number(r.total));

    // Ensure all names appear with zero if missing
    const names = namesRows.map(r => r.resource_name);
    const monthly = names.map(n => ({ resource_name: n, total: monthlyMap.get(n) ?? 0 }));
    const daily = names.map(n => ({ resource_name: n, total: dailyMap.get(n) ?? 0 }));

    // Sort for consistent presentation
    monthly.sort((a, b) => b.total - a.total || a.resource_name.localeCompare(b.resource_name));
    daily.sort((a, b) => b.total - a.total || a.resource_name.localeCompare(b.resource_name));

    return NextResponse.json({ daily, monthly });
  } catch (err) {
    logger.error('Error fetching resource stats', { error: String((err as any)?.message || err) });
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
