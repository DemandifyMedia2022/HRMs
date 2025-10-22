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
    const sql = `SELECT DISTINCT f_campaign_name FROM ${DB_NAME}.dm_form WHERE f_campaign_name IS NOT NULL AND f_campaign_name != '' AND (f_qa_status IS NULL OR f_qa_status = '' OR f_qa_status = 'pending') ORDER BY f_campaign_name`;
    const [rows] = await pool.execute(sql);
    return NextResponse.json({ data: rows });
  } catch (err) {
    console.error('Error fetching campaigns:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
