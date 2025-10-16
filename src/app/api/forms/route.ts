import mysql from 'mysql2/promise'
import { NextResponse } from 'next/server'

const DB_NAME = process.env.DB_NAME || 'newhrmsreactdb'

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: DB_NAME,
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 5,
})

const allowedFields = [
  'f_campaign_name', 'f_lead', 'f_resource_name', 'f_data_source', 'f_salutation', 'f_first_name', 'f_last_name', 'f_job_title', 'f_department', 'f_job_level', 'f_email_add', 'Secondary_Email', 'f_conatct_no', 'f_company_name', 'f_website', 'f_address1', 'f_city', 'f_state', 'f_zip_code', 'f_country', 'f_emp_size', 'f_industry', 'f_sub_industry', 'f_revenue', 'f_revenue_link', 'f_profile_link', 'f_company_link', 'f_address_link', 'f_cq1', 'f_cq2', 'f_cq3', 'f_cq4', 'f_cq5', 'f_cq6', 'f_cq7', 'f_cq8', 'f_cq9', 'f_cq10', 'f_asset_name1', 'f_asset_name2', 'f_call_recording', 'f_email_status', 'f_qa_status', 'f_dq_reason1', 'f_dq_reason2', 'f_dq_reason3', 'f_dq_reason4', 'f_qa_comments', 'f_call_rating', 'f_call_notes', 'feedback', 'f_call_links', 'f_qa_name', 'f_audit_date', 'f_delivary_status', 'f_delivary_date', 'f_delivary_by', 'f_reject_reason', 'added_by_user_id', 'qualifyleads_by', 'f_date', 'form_status'
]

export async function POST(req: Request) {
  try {
    const payload = await req.json()
    if (!payload || typeof payload !== 'object') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // Build insert object with allowed fields only
    const data: Record<string, any> = {}

    for (const k of allowedFields) {
      if (k === 'form_status') {
        // Always set form_status to 'pending' if not provided
        data[k] = payload[k] ?? 'pending';
      } else {
        data[k] = Object.prototype.hasOwnProperty.call(payload, k) ? payload[k] : null;
      }
    }

    const fields = Object.keys(data)
    const placeholders = fields.map(() => '?').join(',')
    const values = fields.map((f) => data[f])

  // Use fully-qualified table name to ensure correct database
  const qualifiedTable = `${DB_NAME}.dm_form`
  const sql = `INSERT INTO ${qualifiedTable} (${fields.join(',')}) VALUES (${placeholders})`
  console.log('Inserting into', qualifiedTable)
  const [result] = await pool.execute(sql, values)

  // @ts-ignore
  const insertId = result?.insertId ?? null
  console.log('Inserted id:', insertId)
  return NextResponse.json({ ok: true, insertedId: insertId })
  } catch (err: any) {
    console.error('api/forms error', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
