export const runtime = 'nodejs';

import mysql from 'mysql2/promise';
import { NextResponse, NextRequest } from 'next/server';
import { handleError } from '@/lib/error-handler';
import { requireAuth, requireRoles } from '@/lib/middleware';
import { createLogger } from '@/lib/logger';
import { getRequiredEnv, getRequiredInt } from '@/lib/env';

const logger = createLogger('status:[id]');

let pool: mysql.Pool | null = null;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: getRequiredEnv('DB_HOST'),
      user: getRequiredEnv('DB_USER'),
      password: getRequiredEnv('DB_PASSWORD'),
      database: getRequiredEnv('DB_NAME'),
      port: getRequiredInt('DB_PORT'),
      waitForConnections: true,
      connectionLimit: 5
    });
  }
  return pool;
}

// GET /api/status/[id] - Get single record
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const pool = getPool();
    const DB_NAME = getRequiredEnv('DB_NAME');
    const [rows] = await pool.execute(`SELECT * FROM ${DB_NAME}.dm_form WHERE f_id = ?`, [id]);
    // @ts-ignore
    const record = rows[0];
    if (!record) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }
    return NextResponse.json({ data: record });
  } catch (err) {
    return handleError(err, req);
  }
}

// PATCH /api/status/[id] - Update status fields
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Authentication required
    const authed = requireAuth(req);
    if (authed instanceof NextResponse) return authed;
    // Authorization: only admin or hr can update
    const authz = requireRoles(req, 'admin', 'hr');
    if (authz instanceof NextResponse) return authz;

    const DB_NAME = getRequiredEnv('DB_NAME');

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
    const { id } = await params;
    const values = [...Object.values(updates), id];

    const qualifiedTable = `${DB_NAME}.dm_form`;
    const sql = `UPDATE ${qualifiedTable} SET ${setClause} WHERE f_id = ?`;

    const pool = getPool();
    const [result] = await pool.execute(sql, values);
    // @ts-ignore
    const affected = result?.affectedRows ?? 0;
    logger.info('PATCH result', { id, affected });

    if (affected === 0) {
      return NextResponse.json({ error: 'Record not found or no changes applied', affected }, { status: 404 });
    }

    return NextResponse.json({ success: true, affected });
  } catch (err) {
    return handleError(err, req);
  }
}
