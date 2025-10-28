export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const DB_NAME = process.env.DB_NAME;
    if (!DB_NAME) {
      return NextResponse.json({ error: 'DB_NAME env not set' }, { status: 500 });
    }
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize') || 20)));
    const offset = (page - 1) * pageSize;
    // dynamic import avoids static bundling errors with Turbopack/Edge
    const mysql = await import('mysql2/promise');

    const pool = mysql.createPool({
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: DB_NAME,
      port: Number(process.env.DB_PORT || 3306),
      waitForConnections: true,
      connectionLimit: 5
    });

    const [rows] = await pool.execute(
      `
      SELECT 
        f_id,
        f_campaign_name,
        f_lead,
        f_email_status,
        f_qa_status,
        f_delivary_status,
        form_status,
        f_date
      FROM ${DB_NAME}.dm_form 
      ORDER BY f_date DESC
      LIMIT ? OFFSET ?
      `,
      [pageSize, offset]
    );

    const [countRows] = await pool.execute(`SELECT COUNT(*) AS cnt FROM ${DB_NAME}.dm_form`);
    // @ts-ignore
    const total = Array.isArray(countRows) && countRows[0] ? Number(countRows[0].cnt) : 0;

    // close pool after query (small apps / dev only). For production reuse a single pool.
    await pool.end();

    return NextResponse.json({ data: rows, total, page, pageSize });
  } catch (err: any) {
    console.error('Error fetching status:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
