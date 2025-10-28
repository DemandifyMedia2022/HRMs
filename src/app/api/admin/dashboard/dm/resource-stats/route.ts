export const runtime = 'nodejs';

import mysql from 'mysql2/promise';
import { NextResponse } from 'next/server';

const DB_NAME = process.env.DB_NAME || 'newhrmsreactdb';

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: DB_NAME,
  port: Number(process.env.DB_PORT || 3306),
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
    console.error('Error fetching resource stats:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
