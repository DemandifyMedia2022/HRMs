import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { verifyToken } from '@/lib/auth';

const DB_NAME = process.env.MYSQL_DATABASE || 'demandkb_lms1';

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
});

async function ensureTable() {
  const sql = `CREATE TABLE IF NOT EXISTS ${DB_NAME}.sip_credentials (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    extension VARCHAR(64) NULL,
    sip_password VARCHAR(255) NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;
  await pool.execute(sql);
}

function getAuthEmail(req: NextRequest): string | null {
  try {
    const token = req.cookies.get('access_token')?.value;
    if (!token) return null;
    const payload = verifyToken(token) as any;
    return payload?.email || null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    await ensureTable();
    const email = getAuthEmail(req);
    if (!email) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const [rows] = await pool.execute(
      `SELECT email, extension, IF(sip_password IS NULL OR sip_password = '', 0, 1) AS hasPassword FROM ${DB_NAME}.sip_credentials WHERE email = ? LIMIT 1`,
      [email]
    );
    // @ts-ignore
    const rec = Array.isArray(rows) && rows.length ? rows[0] : null;
    return NextResponse.json({
      email,
      extension: rec?.extension || '',
      // Do NOT return the actual password; only indicate presence
      hasPassword: !!rec?.hasPassword
    });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureTable();
    const email = getAuthEmail(req);
    if (!email) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const extension = (body?.extension ?? '').toString();
    const sip_password = (body?.sip_password ?? '').toString();

    // Upsert
    await pool.execute(
      `INSERT INTO ${DB_NAME}.sip_credentials (email, extension, sip_password) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE extension = VALUES(extension), sip_password = VALUES(sip_password)`,
      [email, extension || null, sip_password || null]
    );
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
