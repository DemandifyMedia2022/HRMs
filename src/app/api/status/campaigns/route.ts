export const runtime = 'nodejs';

import mysql from 'mysql2/promise';
import { NextResponse } from 'next/server';

const DB_NAME = process.env.DB_NAME as string | undefined;
if (!DB_NAME) {
  console.error('[api/status/campaigns] DB_NAME env not set');
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: DB_NAME || undefined,
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 5
});

export async function GET() {
  try {
    if (!DB_NAME) return NextResponse.json({ error: 'DB_NAME env not set' }, { status: 500 });
    const sql = `SELECT DISTINCT f_campaign_name FROM ${DB_NAME}.dm_form WHERE f_campaign_name IS NOT NULL AND f_campaign_name != '' AND (f_qa_status IS NULL OR f_qa_status = '' OR f_qa_status = 'pending') ORDER BY f_campaign_name`;
    const [rows] = await pool.execute(sql);
    return NextResponse.json({ data: rows });
  } catch (err) {
    console.error('Error fetching campaigns:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
