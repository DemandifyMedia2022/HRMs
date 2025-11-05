import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, mapTypeToRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { maybeEncryptForRequest } from '@/lib/crypto'

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

    const user = await prisma.users.findFirst({
      where: { email: { equals: email } },
      select: { type: true },
    })

    const role = mapTypeToRole(user?.type)
    return NextResponse.json(
      maybeEncryptForRequest(req.headers, { role })
    )
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }
}
