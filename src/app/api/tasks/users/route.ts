import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';

// GET /api/tasks/users - Get users for task assignment (accessible to all authenticated users)
export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const users = await prisma.users.findMany({
      // Many legacy users have a NULL status in the database.
      // Treat NULL or 1 as active so that existing employees appear in the list.
      where: {
        OR: [
          { status: 1 },
          { status: null },
        ],
      },
      select: {
        id: true,
        Full_name: true,
        name: true,
        email: true,
        department: true
      },
      orderBy: {
        Full_name: 'asc'
      },
      take: 100
    });

    const normalized = users.map((user) => ({
      id: Number(user.id),
      Full_name: user.Full_name || user.name || user.email,
      email: user.email,
      department: user.department
    }));

    return NextResponse.json({
      success: true,
      data: normalized
    });
  } catch (error: any) {
    console.error('Get Users Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users', details: error.message },
      { status: 500 }
    );
  }
}
