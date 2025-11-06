export const runtime = 'nodejs';

import mysql from 'mysql2/promise';
import { NextResponse } from 'next/server';
import { handleError } from '@/lib/error-handler';
import { createLogger } from '@/lib/logger';
import { getRequiredEnv, getRequiredInt } from '@/lib/env';

const logger = createLogger('status:campaign');

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

export async function GET(req: Request, { params }: { params: { campaign: string } }) {
  try {
    const campaign = decodeURIComponent(params.campaign);
    const sql = `SELECT * FROM ${DB_NAME}.dm_form WHERE f_campaign_name = ? AND (f_qa_status IS NULL OR f_qa_status = '' OR f_qa_status = 'pending') ORDER BY f_date DESC`;
    const [rows] = await pool.execute(sql, [campaign]);
    return NextResponse.json({ data: rows });
  } catch (err) {
    return handleError(err, req);
  }
}
