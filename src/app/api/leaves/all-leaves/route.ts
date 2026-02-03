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

    // Check if user is a reporting manager
    const currentUser = await prisma.users.findUnique({
      where: { email: session.email },
      select: { Full_name: true, name: true, email: true }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify this user is a reporting manager
    const reportingToCount = await prisma.users.count({
      where: {
        OR: [
          { reporting_manager: currentUser.Full_name },
          { reporting_manager: currentUser.name }
        ]
      }
    });

    if (reportingToCount === 0) {
      return NextResponse.json({ error: 'Access denied. Only reporting managers can access all leaves.' }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const leave_type = searchParams.get('leave_type') || undefined;
    const month = searchParams.get('month') || undefined; // expects YYYY-MM
    const user_name = searchParams.get('user_name') || undefined;
    const hrStatus = searchParams.get('HR_Status') || undefined;
    const managerStatus = searchParams.get('Manager_Status') || undefined;
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const pageSize = Math.max(1, Number(searchParams.get('pageSize') || 25)); // Larger default for comprehensive view

    // Build where clause
    const where: any = {};
    
    if (leave_type) where.leave_type = leave_type;
    if (user_name) where.added_by_user = user_name;
    if (hrStatus) where.HRapproval = hrStatus;
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

    // Transform data - fields are already available in leavedata
    const transformedData = data.map(leave => ({
      ...leave,
      emp_code: leave.emp_code || null,
      department: null, // Not available in leavedata model
      job_role: null,   // Not available in leavedata model  
      company_name: leave.client_company_name || null,
      // Use actual stored approval information from database
      hr_approved_by: leave.hr_approved_by || null,
      hr_approval_status: leave.HRapproval,
      manager_approved_by: leave.manager_approved_by || null,
      manager_approval_status: leave.Managerapproval,
      hr_reject_reason: leave.HRrejectReason,
      manager_reject_reason: leave.ManagerRejecjetReason,
      attachment: leave.attachment || null
    }));

    return NextResponse.json({
      data: transformedData,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize) || 1
      }
    });
  } catch (e: any) {
    const message = typeof e?.message === 'string' ? e.message : 'Failed to fetch all leaves';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
