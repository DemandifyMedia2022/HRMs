import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const DB_NAME = process.env.MYSQL_DATABASE || 'newhrmsreactdb';

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id, 10);
    if (!id) return NextResponse.json({ error: 'invalid id' }, { status: 400 });
    const [rows] = await pool.execute(`SELECT * FROM ${DB_NAME}.campaigns WHERE id = ? LIMIT 1`, [id]);
    // @ts-ignore
    const rec = Array.isArray(rows) && rows.length ? rows[0] : null;
    if (!rec) return NextResponse.json({ error: 'not found' }, { status: 404 });
    return NextResponse.json({ data: rec });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id, 10);
    if (!id) return NextResponse.json({ error: 'invalid id' }, { status: 400 });
    const body = await req.json().catch(() => ({}));
    const fields = [
      'c_id',
      'f_campaign_name',
      'f_start_date',
      'f_end_date',
      'f_assignto',
      'f_allocation',
      'f_method',
      'f_script',
      'f_script_url',
      'f_status'
    ] as const;
    const updates: string[] = [];
    const values: any[] = [];
    for (const f of fields) {
      if (f in body) {
        updates.push(`${f} = ?`);
        if (f === 'f_start_date' || f === 'f_end_date') values.push(body[f] ? new Date(body[f]) : null);
        else if (f === 'f_allocation') values.push(body[f] == null ? null : parseInt(String(body[f]), 10));
        else if (f === 'f_status') values.push(body[f] ? 1 : 0);
        else values.push(body[f]);
      }
    }
    if (!updates.length) return NextResponse.json({ error: 'no fields to update' }, { status: 400 });
    const sql = `UPDATE ${DB_NAME}.campaigns SET ${updates.join(', ')} WHERE id = ?`;
    values.push(id);
    await pool.execute(sql, values);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
