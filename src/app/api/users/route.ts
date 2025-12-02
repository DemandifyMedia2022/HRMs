import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRoles } from '@/lib/middleware';
import { hashPassword } from '@/lib/auth';

// GET /api/users - List all users
export async function GET(req: NextRequest) {
  // For search queries (used in mentions, assignee selection), allow all authenticated users
  const searchParams = req.nextUrl.searchParams;
  const search = searchParams.get('search');
  
  if (search !== null) {
    // Search mode - accessible to all authenticated users
    const { requireAuth } = await import('@/lib/middleware');
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    // Build where clause
    const whereClause: any = {
      status: 1 // Only active users
    };

    // Only add search filters if search term is not empty
    if (search && search.trim().length > 0) {
      whereClause.OR = [
        { Full_name: { contains: search } },
        { email: { contains: search } },
        { name: { contains: search } }
      ];
    }

    const users = await (prisma as any).users.findMany({
      where: whereClause,
      select: { 
        id: true, 
        Full_name: true, 
        name: true, 
        email: true, 
        department: true 
      },
      take: 50 // Limit results
    });

    const normalized = users.map((u: any) => ({
      id: typeof u.id === 'bigint' ? Number(u.id) : u.id,
      Full_name: u.Full_name || u.name,
      email: u.email,
      department: u.department
    }));

    return NextResponse.json({ success: true, data: normalized });
  }

  // Full list mode - admin only
  const auth = requireRoles(req, 'admin');
  if (auth instanceof NextResponse) return auth;

  const users = await (prisma as any).users.findMany({
    select: { id: true, name: true, email: true, type: true, department: true, createdAt: true, updatedAt: true }
  });
  const normalized = users.map((u: any) => ({
    id: typeof u.id === 'bigint' ? Number(u.id) : u.id,
    name: u.name,
    email: u.email,
    role: String(u.type || 'user').toLowerCase(),
    department: u.department,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt
  }));
  return NextResponse.json(normalized);
}

// POST /api/users - Create user (admin only)
export async function POST(req: NextRequest) {
  const auth = requireRoles(req, 'admin');
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { name, email, password, role = 'user', department = null } = body || {};
    if (!name || !email || !password) {
      return NextResponse.json({ message: 'name, email, and password are required' }, { status: 400 });
    }

    const exists = await (prisma as any).users.findUnique({ where: { email } });
    if (exists) return NextResponse.json({ message: 'Email already exists' }, { status: 409 });

    const hashed = hashPassword(password);
    const created = await (prisma as any).users.create({
      data: { name, email, password: hashed, type: role, department },
      select: { id: true, name: true, email: true, type: true, department: true, createdAt: true, updatedAt: true }
    });
    const dto = {
      id: typeof created.id === 'bigint' ? Number(created.id) : created.id,
      name: created.name,
      email: created.email,
      role: String(created.type || 'user').toLowerCase(),
      department: created.department,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt
    };
    return NextResponse.json(dto, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ message: 'Failed to create user', details: e.message }, { status: 500 });
  }
}
