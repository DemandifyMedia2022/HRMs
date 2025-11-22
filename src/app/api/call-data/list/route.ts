export const runtime = 'nodejs';

import mysql from 'mysql2/promise';
import { NextResponse } from 'next/server';
import { getRequiredEnv, getRequiredInt } from '@/lib/env';
import { createLogger } from '@/lib/logger';

const logger = createLogger('call-data:list');
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

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userName = url.searchParams.get('user_name');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '200', 10) || 200, 500);

    const pool = getPool();
    const DB_NAME = getRequiredEnv('DB_NAME');
    let sql = `SELECT id, extension, user_name, destination, direction, status, start_time, answer_time, end_time, duration_seconds, cause, recording_url
               FROM ${DB_NAME}.call_data`;
    const params: any[] = [];
    if (userName) {
      sql += ` WHERE user_name = ?`;
      params.push(userName);
    }
    sql += ` ORDER BY id DESC LIMIT ?`;
    params.push(limit);

    const [rows] = await pool.execute(sql, params);
    return NextResponse.json({ data: rows });
  } catch (err: any) {
    logger.error('GET error', { error: String(err?.message || err) });
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
