import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const idNum = Number(params.id);
    if (!idNum) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    const user = await prisma.users.findUnique({ where: { id: BigInt(idNum) } as any });
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Convert BigInt fields to Number for safe JSON serialization
    const plain = Object.fromEntries(
      Object.entries(user as Record<string, any>).map(([k, v]) => [k, typeof v === 'bigint' ? Number(v) : v])
    );
    return NextResponse.json(plain);
  } catch (e: any) {
    console.error('/api/hr/employees/[id] error:', e);
    return NextResponse.json({ error: 'Failed to load employee' }, { status: 500 });
  }
}
