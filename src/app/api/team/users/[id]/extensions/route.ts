import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { verifyToken } from '@/lib/auth';
import { getRequiredEnv, getRequiredInt } from '@/lib/env';

let pool: mysql.Pool | null = null;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: getRequiredEnv('DB_HOST'),
      user: getRequiredEnv('DB_USER'),
      password: getRequiredEnv('DB_PASSWORD'),
      database: getRequiredEnv('DB_NAME'),
      waitForConnections: true,
      connectionLimit: 10,
      port: getRequiredInt('DB_PORT')
    });
  }
  return pool;
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

async function requireTeamRole(req: NextRequest) {
  const email = getAuthEmail(req);
  if (!email) return { ok: false, res: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }) };
  const pool = getPool();
  const DB_NAME = getRequiredEnv('DB_NAME');
  const [rows] = await pool.execute(`SELECT job_role FROM ${DB_NAME}.users WHERE email = ? LIMIT 1`, [email]);
  const arr = Array.isArray(rows) ? (rows as any[]) : [];
  const me = arr.length ? arr[0] : null;
  const raw = String(me?.job_role || '');
  const job_role = raw
    .toLowerCase()
    .replace(/[\W_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const isATL = job_role.includes('assistant') && job_role.includes('team') && job_role.includes('lead');
  const isHOO = (job_role.includes('head') && job_role.includes('operation')) || job_role === 'head of operations';
  const allowed = isATL || isHOO;
  if (!allowed) return { ok: false, res: NextResponse.json({ message: 'Forbidden' }, { status: 403 }) };
  return { ok: true };
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const guard = await requireTeamRole(req);
    if (!guard.ok) return guard.res;

    const { id: idStr } = await params;
    const userId = Number(idStr);
    if (!Number.isFinite(userId)) return NextResponse.json({ message: 'Invalid user id' }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const extension = String(body?.extension ?? '').trim();

    // Ensure users table has extension column (best-effort)
    const pool = getPool();
    const DB_NAME = getRequiredEnv('DB_NAME');
    try {
      await pool.execute(`ALTER TABLE ${DB_NAME}.users ADD COLUMN extension VARCHAR(64) NULL`);
    } catch { }

    // Optional: validate extension exists in extensions table
    if (extension) {
      const [erows] = await pool.execute(`SELECT id FROM ${DB_NAME}.extensions WHERE extension = ? LIMIT 1`, [
        extension
      ]);
      // @ts-ignore
      const exists = Array.isArray(erows) && erows.length > 0;
      if (!exists) return NextResponse.json({ message: 'Extension not found' }, { status: 404 });
    }

    await pool.execute(`UPDATE ${DB_NAME}.users SET extension = ? WHERE id = ?`, [extension || null, userId]);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
