import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { verifyToken } from '@/lib/auth';
import { getRequiredEnv, getRequiredInt } from '@/lib/env';
import type { RowDataPacket } from 'mysql2/promise';

const DB_NAME = getRequiredEnv('DB_NAME');

const pool = mysql.createPool({
  host: getRequiredEnv('DB_HOST'),
  user: getRequiredEnv('DB_USER'),
  password: getRequiredEnv('DB_PASSWORD'),
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  port: getRequiredInt('DB_PORT')
});

async function ensureSchema() {
  // Create `extensions` table and add `extension` column on `users`
  await pool.execute(`CREATE TABLE IF NOT EXISTS ${DB_NAME}.extensions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    extension VARCHAR(64) NOT NULL UNIQUE,
    username VARCHAR(128) NULL,
    password VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

  // Add column to users
  try {
    await pool.execute(`ALTER TABLE ${DB_NAME}.users ADD COLUMN extension VARCHAR(64) NULL`);
  } catch {}
}

function getAuthEmail(req: NextRequest): string | null {
  try {
    const token = req.cookies.get('access_token')?.value;
    if (!token) return null;
    const payload = verifyToken(token) as any;
    return (payload?.email || payload?.sub || '').toString() || null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    await ensureSchema();
    const email = getAuthEmail(req);
    if (!email) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    // 1) Find user's assigned extension
    const [urows] = await pool.execute<RowDataPacket[]>(
      `SELECT extension FROM ${DB_NAME}.users WHERE email = ? LIMIT 1`,
      [email]
    );
    const user = urows && urows.length ? (urows[0] as RowDataPacket) : null;
    const ext = (user?.extension || '').toString();
    if (!ext) return NextResponse.json({ extension: '', password: '', assigned: false });

    // 2) Get credentials for that extension
    const [erows] = await pool.execute<RowDataPacket[]>(
      `SELECT extension, username, password FROM ${DB_NAME}.extensions WHERE extension = ? LIMIT 1`,
      [ext]
    );
    const rec = erows && erows.length ? (erows[0] as RowDataPacket) : null;
    if (!rec) return NextResponse.json({ extension: ext, password: '', assigned: true, found: false });

    return NextResponse.json({
      extension: rec.extension,
      password: rec.password || '',
      username: rec.username || '',
      assigned: true,
      found: true
    });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}

// Optional: allow admin to bind an extension to a user
export async function POST(req: NextRequest) {
  try {
    await ensureSchema();
    const email = getAuthEmail(req);
    if (!email) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const extension = (body?.extension || '').toString().trim();
    if (!extension) return NextResponse.json({ error: 'extension required' }, { status: 400 });

    await pool.execute(`UPDATE ${DB_NAME}.users SET extension = ? WHERE email = ?`, [extension, email]);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
