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
  const sql = `CREATE TABLE IF NOT EXISTS ${DB_NAME}.campaigns (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    c_id VARCHAR(64) NOT NULL,
    f_campaign_name VARCHAR(255) NOT NULL,
    f_start_date DATE NULL,
    f_end_date DATE NULL,
    f_assignto VARCHAR(255) NULL,
    f_allocation INT NULL,
    f_method VARCHAR(255) NULL,
    f_script TEXT NULL,
    f_script_url VARCHAR(512) NULL,
    f_status TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;
  await pool.execute(sql);
  try {
    await pool.execute(`ALTER TABLE ${DB_NAME}.campaigns ADD COLUMN IF NOT EXISTS f_script_url VARCHAR(512) NULL`);
  } catch {}
}

export async function GET() {
  try {
    await ensureTable();
    const [rows] = await pool.execute(`SELECT * FROM ${DB_NAME}.campaigns ORDER BY id DESC LIMIT 500`);
    return NextResponse.json({ data: rows });
  } catch (err: any) {
    console.error('campaigns GET error', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await ensureTable();
    const body = await req.json();
    const {
      c_id,
      f_campaign_name,
      f_start_date,
      f_end_date,
      f_assignto,
      f_allocation,
      f_method,
      f_script,
      f_script_url,
      f_status
    } = body || {};

    if (!c_id || !f_campaign_name) {
      return NextResponse.json({ error: 'c_id and f_campaign_name are required' }, { status: 400 });
    }

    const sql = `INSERT INTO ${DB_NAME}.campaigns
      (c_id, f_campaign_name, f_start_date, f_end_date, f_assignto, f_allocation, f_method, f_script, f_script_url, f_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const values = [
      String(c_id),
      String(f_campaign_name),
      f_start_date ? new Date(f_start_date) : null,
      f_end_date ? new Date(f_end_date) : null,
      f_assignto ?? null,
      typeof f_allocation === 'number' ? f_allocation : f_allocation ? parseInt(String(f_allocation), 10) : null,
      f_method ?? null,
      f_script ?? null,
      f_script_url ?? null,
      f_status ? 1 : 0
    ];

    const [result] = await pool.execute(sql, values);
    // @ts-ignore
    const insertId = result?.insertId ?? null;
    return NextResponse.json({ ok: true, id: insertId });
  } catch (err: any) {
    console.error('campaigns POST error', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
