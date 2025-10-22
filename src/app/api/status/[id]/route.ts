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

// GET /api/status/[id] - Get single record
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const [rows] = await pool.execute('SELECT * FROM dm_form WHERE f_id = ?', [params.id]);
    // @ts-ignore
    const record = rows[0];
    if (!record) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }
    return NextResponse.json({ data: record });
  } catch (err) {
    console.error('Error fetching record:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// PATCH /api/status/[id] - Update status fields
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const allowedFields = [
      'f_email_status',
      'f_qa_status',
      'f_delivary_status',
      'form_status',
      // QA / audit fields
      'f_qa_name',
      'f_audit_date',
      'f_qa_comments',
      'f_dq_reason1',
      'f_dq_reason2',
      'f_dq_reason3',
      'f_dq_reason4',
      'f_call_links',
      // Delivery fields
      'f_delivary_date',
      'f_delivary_by',
      'f_reject_reason',
      // Lead qualification / ownership
      'qualifyleads_by',
      'added_by_user_id',
      // Call and feedback
      'f_call_rating',
      'f_call_notes',
      'feedback'
    ];

    const updates: Record<string, any> = {};
    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const setClause = Object.keys(updates)
      .map(key => `${key} = ?`)
      .join(', ');
    const values = [...Object.values(updates), params.id];

    const qualifiedTable = `${DB_NAME}.dm_form`;
    const sql = `UPDATE ${qualifiedTable} SET ${setClause} WHERE f_id = ?`;
    console.log('PATCH', { id: params.id, updates, sql, values });

    const [result] = await pool.execute(sql, values);
    // @ts-ignore
    const affected = result?.affectedRows ?? 0;
    console.log('PATCH result', { affected, raw: result });

    if (affected === 0) {
      return NextResponse.json({ error: 'Record not found or no changes applied', affected }, { status: 404 });
    }

    return NextResponse.json({ success: true, affected });
  } catch (err) {
    console.error('Error updating status:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
