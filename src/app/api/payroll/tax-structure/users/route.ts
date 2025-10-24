import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/payroll/tax-structure/users
// Mirrors Laravel: DB::table('users')->select('id','Full_name')->get();
export async function GET() {
  try {
    const users = await (prisma as any).users.findMany({
      select: {
        id: true,
        Full_name: true,
      },
      orderBy: { id: 'asc' },
    })

    const data = users.map((u: any) => ({
      id: typeof u.id === 'bigint' ? u.id.toString() : u.id,
      Full_name: u.Full_name ?? null,
    }))

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('tax-structure/users GET error', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch users' }, { status: 500 })
  }
}
