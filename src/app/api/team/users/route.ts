import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import mysql from 'mysql2/promise';
import { getRequiredEnv, getRequiredInt } from '@/lib/env';

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

function deriveNameFromEmail(email: string): string {
  const local = (email || '').split('@')[0] || ''
  const parts = local.replace(/[^a-zA-Z0-9._\- ]+/g, ' ').replace(/[._-]+/g, ' ').trim().split(/\s+/)
  const cased = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ')
  return cased || email || ''
}

export async function GET(req: NextRequest) {
  try {
    const email = getAuthEmail(req);
    if (!email) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    try {
      await pool.execute(`ALTER TABLE ${DB_NAME}.users ADD COLUMN extension VARCHAR(64) NULL`);
    } catch {}

    const [rows] = await pool.execute(
      `SELECT id, name, email, COALESCE(extension, '') AS extension
       FROM ${DB_NAME}.users
       WHERE LOWER(COALESCE(department, '')) IN ('operation','sales')
       ORDER BY name ASC`
    );
    const arr = Array.isArray(rows) ? (rows as any[]) : [];
    const list = arr.map((u: any) => {
      const rawName = (u.name || '').toString().trim()
      const email = (u.email || '').toString().trim()
      const looksLikeEmail = /@/.test(rawName) || !rawName || rawName.toLowerCase() === email.toLowerCase()
      const displayName = looksLikeEmail ? deriveNameFromEmail(email) : rawName
      return {
        id: typeof u.id === 'bigint' ? Number(u.id) : u.id,
        name: displayName,
        email,
        extension: u.extension || ''
      }
    });
    return NextResponse.json(list);
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
