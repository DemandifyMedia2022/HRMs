export const runtime = 'nodejs'

import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // dynamic import avoids static bundling errors with Turbopack/Edge
    const mysql = await import('mysql2/promise')

    const pool = mysql.createPool({
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'newhrmsreactdb',
      port: Number(process.env.DB_PORT || 3306),
      waitForConnections: true,
      connectionLimit: 5,
    })

    const [rows] = await pool.execute(`
      SELECT 
        f_id,
        f_campaign_name,
        f_lead,
        f_email_status,
        f_qa_status,
        f_delivary_status,
        form_status,
        f_date
      FROM dm_form 
      ORDER BY f_date DESC
    `)

    // close pool after query (small apps / dev only). For production reuse a single pool.
    await pool.end()

    return NextResponse.json({ data: rows })
  } catch (err: any) {
    console.error('Error fetching status:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}