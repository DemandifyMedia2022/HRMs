export const runtime = 'nodejs';

import mysql from 'mysql2/promise';
import { NextResponse } from 'next/server';

const DB_NAME = process.env.DB_NAME || 'demandkb_lms1';

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: DB_NAME,
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 5
});

async function ensureTable() {
  const sql = `CREATE TABLE IF NOT EXISTS ${DB_NAME}.call_data (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    extension VARCHAR(64) NULL,
    source_number VARCHAR(64) NULL,
    user_name VARCHAR(255) NULL,
    destination VARCHAR(64) NULL,
    direction VARCHAR(16) NULL,
    status VARCHAR(32) NULL,
    start_time DATETIME NULL,
    answer_time DATETIME NULL,
    end_time DATETIME NULL,
    duration_seconds INT NULL,
    cause VARCHAR(255) NULL,
    recording_url VARCHAR(255) NULL,
    meta JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;
  await pool.execute(sql);
  // Best-effort ensure column exists even if table pre-existed without it
  try {
    await pool.execute(`ALTER TABLE ${DB_NAME}.call_data ADD COLUMN IF NOT EXISTS user_name VARCHAR(255) NULL`);
  } catch {}
  try {
    await pool.execute(`ALTER TABLE ${DB_NAME}.call_data ADD COLUMN IF NOT EXISTS recording_url VARCHAR(255) NULL`);
  } catch {}
  try {
    await pool.execute(`ALTER TABLE ${DB_NAME}.call_data ADD COLUMN IF NOT EXISTS source_number VARCHAR(64) NULL`);
  } catch {}
}

export async function GET() {
  try {
    await ensureTable();
    return NextResponse.json({ ok: true, table: `${DB_NAME}.call_data` });
  } catch (err: any) {
    console.error('call-data GET error', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await ensureTable();
    const body = await req.json();
    const {
      extension,
      source_number,
      destination,
      direction,
      status,
      start_time,
      answer_time,
      end_time,
      duration_seconds,
      cause,
      recording_url,
      meta
    } = body || {};

    const sql = `INSERT INTO ${DB_NAME}.call_data (
      extension, source_number, user_name, destination, direction, status, start_time, answer_time, end_time, duration_seconds, cause, recording_url, meta
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const values = [
      extension ?? null,
      source_number ?? null,
      body?.user_name ?? null,
      destination ?? null,
      direction ?? null,
      status ?? null,
      start_time ? new Date(start_time) : null,
      answer_time ? new Date(answer_time) : null,
      end_time ? new Date(end_time) : null,
      duration_seconds ?? null,
      cause ?? null,
      recording_url ?? null,
      meta ? JSON.stringify(meta) : null
    ];

    const [result] = await pool.execute(sql, values);
    // @ts-ignore
    const insertId = result?.insertId ?? null;
    return NextResponse.json({ ok: true, id: insertId });
  } catch (err: any) {
    console.error('call-data POST error', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
