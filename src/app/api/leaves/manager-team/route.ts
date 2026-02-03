import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    // Get token from cookies
    const token = (req as any).cookies?.get('access_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify token and get user info
    const session = verifyToken(token);
    if (!session?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user details
    const currentUser = await prisma.users.findUnique({
      where: { email: session.email },
      select: { Full_name: true, name: true, email: true }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get users who report to this manager
    const reportingUsers = await prisma.users.findMany({
      where: {
        OR: [
          { reporting_manager: currentUser.Full_name },
          { reporting_manager: currentUser.name }
        ]
      },
      select: { Full_name: true, name: true }
    });

    const userNames = reportingUsers.map(u => u.Full_name || u.name).filter(Boolean);

    if (userNames.length === 0) {
      return NextResponse.json({
        data: [],
        pagination: {
          page: 1,
          pageSize: 10,
          total: 0,
          totalPages: 0
        }
      });
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const leave_type = searchParams.get('leave_type') || undefined;
    const month = searchParams.get('month') || undefined; // expects YYYY-MM
    const user_name = searchParams.get('user_name') || undefined;
    const managerStatus = searchParams.get('Manager_Status') || undefined;
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const pageSize = Math.max(1, Number(searchParams.get('pageSize') || 10));

    // Build where clause
    const where: any = {
      added_by_user: { in: userNames }
    };
    
    if (leave_type) where.leave_type = leave_type;
    if (user_name) where.added_by_user = user_name;
    if (managerStatus) where.Managerapproval = managerStatus;

    if (month) {
      const [y, m] = month.split('-');
      const year = Number(y);
      const mon = Number(m) - 1;
      if (!isNaN(year) && !isNaN(mon)) {
        const start = new Date(Date.UTC(year, mon, 1));
        const end = new Date(Date.UTC(year, mon + 1, 0, 23, 59, 59, 999));
        where.start_date = { gte: start, lte: end };
      }
    }

    const [total, data] = await Promise.all([
      prisma.leavedata.count({ where }),
      prisma.leavedata.findMany({
        where,
        orderBy: { start_date: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ]);

    return NextResponse.json({
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize) || 1
      }
    });
  } catch (e: any) {
    const message = typeof e?.message === 'string' ? e.message : 'Failed to fetch team leaves';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
