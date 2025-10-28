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
    console.error('Error fetching leads by status:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
