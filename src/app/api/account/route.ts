import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

async function getMe(req: NextRequest) {
  const token = req.cookies.get('access_token')?.value
  if (!token) return null
  try {
    const payload = verifyToken(token) as any
    const email = String(payload.email || '')
    if (!email) return null
    const user = await (prisma as any).users.findUnique({ where: { email } })
    if (!user) return null
    return user
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const user = await getMe(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const data = {
    email: user.email as string,
    name: (user.Full_name ?? user.name ?? '') as string,
    personal_email: (user.Personal_Email ?? '') as string,
    contact_no: (user.contact_no ?? '') as string,
    department: (user.department ?? '') as string
  }
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const user = await getMe(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const name = typeof body?.name === 'string' ? body.name.trim() : undefined
  const personal_email = typeof body?.personal_email === 'string' ? body.personal_email.trim() : undefined
  const contact_no = typeof body?.contact_no === 'string' ? body.contact_no.trim() : undefined
  const department = typeof body?.department === 'string' ? body.department.trim() : undefined

  const data: any = {}
  if (name !== undefined) {
    data.Full_name = name
    data.name = name
  }
  if (personal_email !== undefined) data.Personal_Email = personal_email
  if (contact_no !== undefined) data.contact_no = contact_no
  if (department !== undefined) data.department = department

  const updated = await (prisma as any).users.update({ where: { email: user.email }, data })
  return NextResponse.json({ ok: true, name: updated.Full_name ?? updated.name, personal_email: updated.Personal_Email, contact_no: updated.contact_no, department: updated.department })
}
