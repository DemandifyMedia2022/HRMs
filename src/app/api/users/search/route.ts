// src/app/api/users/search/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    const viewerName = (searchParams.get('viewer_name') || '').trim();

    if (!viewerName) return NextResponse.json({ error: 'viewer_name required' }, { status: 400 });
    if (!q) return NextResponse.json({ items: [] });

    // Resolve viewer company (enforce same-company search)
    const isViewerEmail = viewerName.includes('@');
    const localV = isViewerEmail ? viewerName.split('@')[0] : viewerName;
    const tokensV = localV.split(/[._\s]+/).filter(Boolean);

    const viewer = await prisma.users.findFirst({
      where: isViewerEmail
        ? { email: viewerName }
        : tokensV.length
        ? { AND: tokensV.map(t => ({ OR: [{ name: { contains: t } }, { Full_name: { contains: t } }] })) }
        : { OR: [{ name: viewerName }, { Full_name: viewerName }] },
      select: { client_company_name: true }
    });

    const viewerCompany = viewer?.client_company_name || null;
    if (!viewerCompany) return NextResponse.json({ error: 'Forbidden: cannot resolve viewer company' }, { status: 403 });

    // Build search query
    const isEmail = q.includes('@');
    const localQ = isEmail ? q.split('@')[0] : q;

    const results = await prisma.users.findMany({
      where: {
        client_company_name: viewerCompany,
        OR: [
          { email: { contains: q } },
          { name: { contains: localQ } },
          { Full_name: { contains: localQ } }
        ]
      },
      select: { email: true, name: true, Full_name: true, client_company_name: true },
      take: 10
    });

    const items = results.map(u => ({
      email: u.email || '',
      name: u.name || '',
      fullName: u.Full_name || '',
      company: u.client_company_name || ''
    }));

    return NextResponse.json({ items });
  } catch (e: any) {
    const msg = typeof e?.message === 'string' ? e.message : 'Search failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}