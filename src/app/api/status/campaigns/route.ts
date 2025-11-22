export const runtime = 'nodejs';

import mysql from 'mysql2/promise';
import { NextResponse } from 'next/server';
import { handleError } from '@/lib/error-handler';
import { createLogger } from '@/lib/logger';
import { getRequiredEnv, getRequiredInt } from '@/lib/env';

const logger = createLogger('status:campaigns');

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

export async function GET() {
  try {
    const pool = getPool();
    const DB_NAME = getRequiredEnv('DB_NAME');
    const sql = `SELECT DISTINCT f_campaign_name FROM ${DB_NAME}.dm_form WHERE f_campaign_name IS NOT NULL AND f_campaign_name != '' AND (f_qa_status IS NULL OR f_qa_status = '' OR f_qa_status = 'pending') ORDER BY f_campaign_name`;
    const [rows] = await pool.execute(sql);
    return NextResponse.json({ data: rows });
  } catch (err) {
    // No request object here; construct minimal Request-like object
    return handleError(err, new Request('http://localhost/api/status/campaigns'));
  }
}
