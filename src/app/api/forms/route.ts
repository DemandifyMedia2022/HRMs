import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { verifyToken } from '@/lib/auth';

const DB_NAME = process.env.MYSQL_DATABASE || 'newhrmsreactdb';

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
});

async function ensureSchema() {
  await pool.execute(`CREATE TABLE IF NOT EXISTS ${DB_NAME}.extensions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    extension VARCHAR(64) NOT NULL UNIQUE,
    username VARCHAR(128) NULL,
    password VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
}

function getAuth(req: NextRequest): { email: string; role: string } | null {
  try {
    const token = req.cookies.get('access_token')?.value;
    if (!token) return null;
    const payload = verifyToken(token) as any;
    const role = String(payload?.role || '').toLowerCase();
    const email = String(payload?.email || payload?.sub || '');
    if (!email) return null;
    return { email, role };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    await ensureSchema();
    const auth = getAuth(req);
    if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const [rows] = await pool.execute(
      `SELECT id, extension, username FROM ${DB_NAME}.extensions ORDER BY extension ASC`
    );
    const arr = Array.isArray(rows) ? (rows as any[]) : [];
    const list = arr.map((r: any) => ({
      id: typeof r.id === 'bigint' ? Number(r.id) : r.id,
      extension: String(r.extension),
      username: r.username || ''
    }));
    return NextResponse.json(list);
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureSchema();
    const auth = getAuth(req);
    if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const [urows] = await pool.execute(`SELECT job_role FROM ${DB_NAME}.users WHERE email = ? LIMIT 1`, [auth.email]);
    const uarr = Array.isArray(urows) ? (urows as any[]) : [];
    const me = uarr.length ? uarr[0] : null;
    const jobRole = String(me?.job_role || '').toLowerCase();
    const allowed = jobRole === 'head of operation' || jobRole === 'assistant team lead';
    if (!allowed) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const username = String(body?.username ?? '').trim();
    const password = String(body?.password ?? '').trim();
    if (!username) return NextResponse.json({ message: 'username required' }, { status: 400 });

    const [mrows] = await pool.execute(
      `SELECT extension FROM ${DB_NAME}.extensions ORDER BY CAST(extension AS UNSIGNED) DESC LIMIT 1`
    );
    const marr = Array.isArray(mrows) ? (mrows as any[]) : [];
    const topExt = marr.length ? String(marr[0]?.extension || '') : '';
    let nextNum = 1001;
    const topNum = parseInt(topExt, 10);
    if (Number.isFinite(topNum)) nextNum = Math.max(1001, topNum + 1);

    let nextExt = String(nextNum);
    let exists = true;
    while (exists) {
      const [chk] = await pool.execute(`SELECT id FROM ${DB_NAME}.extensions WHERE extension = ? LIMIT 1`, [nextExt]);
      const carr = Array.isArray(chk) ? (chk as any[]) : [];
      exists = carr.length > 0;
      if (exists) {
        nextNum += 1;
        nextExt = String(nextNum);
      }
    }

    const [res] = await pool.execute(
      `INSERT INTO ${DB_NAME}.extensions (extension, username, password) VALUES (?, ?, ?)`,
      [nextExt, username || null, password || null]
    );
    const insertId = (res as any)?.insertId ?? null;
    return NextResponse.json({ id: insertId ? Number(insertId) : null, extension: nextExt, username });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
