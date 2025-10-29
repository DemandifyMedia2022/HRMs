import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'
import { verifyToken } from '@/lib/auth'

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

    const [rows] = await pool.execute(
      `SELECT 
         COALESCE(NULLIF(TRIM(role), ''), '') AS role,
         COALESCE(NULLIF(TRIM(department), ''), '') AS department
       FROM ${DB_NAME}.users
       WHERE LOWER(email) = LOWER(?)
       LIMIT 1`,
      [email]
    )

    const list = Array.isArray(rows) ? (rows as any[]) : []
    const u = list[0] || {}
    const roleRaw = String(u.role || '')
    const deptRaw = String(u.department || '')
    const role = (roleRaw || deptRaw || '').toLowerCase()

    return NextResponse.json({ role, email })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }
}
