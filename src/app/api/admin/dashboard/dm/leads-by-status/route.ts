export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/logger';

const logger = createLogger('admin:leads-by-status');

export async function GET() {
  try {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = now.getMonth() + 1;

    const rows = await prisma.$queryRaw<any[]>`
      SELECT COALESCE(NULLIF(TRIM(f_qa_status), ''), 'pending') AS status, COUNT(*) AS count
      FROM dm_form
      WHERE YEAR(f_date) = ${yyyy} AND MONTH(f_date) = ${mm}
      GROUP BY COALESCE(NULLIF(TRIM(f_qa_status), ''), 'pending')
      ORDER BY count DESC
    `;

    return NextResponse.json(rows);
  } catch (err) {
    logger.error('Error fetching leads by status', { error: String((err as any)?.message || err) });
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
