export const runtime = 'nodejs';

import mysql from 'mysql2/promise';
import { NextResponse } from 'next/server';
import { getRequiredEnv, getRequiredInt } from '@/lib/env';
import { createLogger } from '@/lib/logger';

const logger = createLogger('admin:resource-stats');
const DB_NAME = getRequiredEnv('DB_NAME');

const pool = mysql.createPool({
  host: getRequiredEnv('DB_HOST'),
  user: getRequiredEnv('DB_USER'),
  password: getRequiredEnv('DB_PASSWORD'),
  database: DB_NAME,
  port: getRequiredInt('DB_PORT'),
  waitForConnections: true,
  connectionLimit: 5
});

export async function GET() {
  try {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = now.getMonth() + 1;
    const yyyyMmDd = now.toISOString().slice(0, 10); // YYYY-MM-DD

    // Get all resource names seen in the current month
    const [namesRows] = await pool.query(
      `SELECT DISTINCT f_resource_name AS resource_name
       FROM ${DB_NAME}.dm_form
       WHERE YEAR(f_date) = ? AND MONTH(f_date) = ? AND f_resource_name IS NOT NULL AND TRIM(f_resource_name) <> ''`,
      [yyyy, mm]
    );

    // Monthly counts
    const [monthlyRows] = await pool.query(
      `SELECT f_resource_name AS resource_name, COUNT(*) AS total
       FROM ${DB_NAME}.dm_form
       WHERE MONTH(f_date) = ? AND YEAR(f_date) = ?
       GROUP BY f_resource_name`,
      [mm, yyyy]
    );

    // Daily counts (today)
    const [dailyRows] = await pool.query(
      `SELECT f_resource_name AS resource_name, COUNT(*) AS total
       FROM ${DB_NAME}.dm_form
       WHERE DATE(f_date) = ?
       GROUP BY f_resource_name`,
      [yyyyMmDd]
    );

    // Build maps for quick lookup
    const monthlyMap = new Map<string, number>();
    for (const r of monthlyRows as any[]) monthlyMap.set(r.resource_name, Number(r.total));
    const dailyMap = new Map<string, number>();
    for (const r of dailyRows as any[]) dailyMap.set(r.resource_name, Number(r.total));

    // Ensure all names appear with zero if missing
    const names = (namesRows as any[]).map(r => r.resource_name);
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
