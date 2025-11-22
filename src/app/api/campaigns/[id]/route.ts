import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { getRequiredEnv, getRequiredInt } from '@/lib/env';
import { handleError } from '@/lib/error-handler';

let pool: mysql.Pool | null = null;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: getRequiredEnv('DB_HOST'),
      user: getRequiredEnv('DB_USER'),
      password: getRequiredEnv('DB_PASSWORD'),
      database: getRequiredEnv('DB_NAME'),
      waitForConnections: true,
      connectionLimit: 10,
      port: getRequiredInt('DB_PORT')
    });
  }
  return pool;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);
    if (!id) return NextResponse.json({ error: 'invalid id' }, { status: 400 });
    const pool = getPool();
    const DB_NAME = getRequiredEnv('DB_NAME');
    const [rows] = await pool.execute(`SELECT * FROM ${DB_NAME}.campaigns WHERE id = ? LIMIT 1`, [id]);
    // @ts-ignore
    const rec = Array.isArray(rows) && rows.length ? rows[0] : null;
    if (!rec) return NextResponse.json({ error: 'not found' }, { status: 404 });
    return NextResponse.json({ data: rec });
  } catch (e: any) {
    return handleError(e, req);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const role = req.headers.get('x-user-role');
    if (role !== 'admin' && role !== 'hr') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);
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
    const pool = getPool();
    const DB_NAME = getRequiredEnv('DB_NAME');
    const sql = `UPDATE ${DB_NAME}.campaigns SET ${updates.join(', ')} WHERE id = ?`;
    values.push(id);
    await pool.execute(sql, values);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return handleError(e, req);
  }
}
