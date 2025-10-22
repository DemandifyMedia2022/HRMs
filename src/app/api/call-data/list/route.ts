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

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userName = url.searchParams.get('user_name');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '200', 10) || 200, 500);

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
    console.error('call-data/list GET error', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
