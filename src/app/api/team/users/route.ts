import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import mysql from 'mysql2/promise'

const DB_NAME = process.env.MYSQL_DATABASE || 'demandkb_lms1'

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
})

function getAuthEmail(req: NextRequest): string | null {
  try {
    const token = req.cookies.get('access_token')?.value
    if (!token) return null
    const payload = verifyToken(token) as any
    return (payload?.email || payload?.sub || '').toString() || null
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  try {
    const email = getAuthEmail(req)
    if (!email) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    try { await pool.execute(`ALTER TABLE ${DB_NAME}.users ADD COLUMN extension VARCHAR(64) NULL`) } catch {}

    const [rows] = await pool.execute(
      `SELECT id, name, email, COALESCE(extension, '') AS extension
       FROM ${DB_NAME}.users
       WHERE LOWER(COALESCE(department, '')) IN ('operation','sales')
       ORDER BY name ASC`
    )
    const arr = Array.isArray(rows) ? (rows as any[]) : []
    const list = arr.map((u: any) => ({
      id: typeof u.id === 'bigint' ? Number(u.id) : u.id,
      name: u.name || '',
      email: u.email || '',
      extension: u.extension || ''
    }))
    return NextResponse.json(list)
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }
}