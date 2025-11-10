export const runtime = 'nodejs';

import mysql from 'mysql2/promise';
import { NextResponse } from 'next/server';
import { getRequiredEnv, getRequiredInt } from '@/lib/env';
import { createLogger } from '@/lib/logger';

const logger = createLogger('admin:leads-by-status');
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
    const [rows] = await pool.query(
      `SELECT COALESCE(NULLIF(TRIM(f_qa_status), ''), 'pending') AS status, COUNT(*) AS count
       FROM ${DB_NAME}.dm_form
       WHERE YEAR(f_date) = ? AND MONTH(f_date) = ?
       GROUP BY COALESCE(NULLIF(TRIM(f_qa_status), ''), 'pending')
       ORDER BY count DESC`,
      [yyyy, mm]
    );

    return NextResponse.json(rows);
  } catch (err) {
    logger.error('Error fetching leads by status', { error: String((err as any)?.message || err) });
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
