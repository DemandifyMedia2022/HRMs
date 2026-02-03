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

    // Check if anyone reports to this user
    const reportingToCount = await prisma.users.count({
      where: {
        OR: [
          { reporting_manager: currentUser.Full_name },
          { reporting_manager: currentUser.name }
        ]
      }
    });

    const isReportingManager = reportingToCount > 0;

    return NextResponse.json({
      isReportingManager,
      reportingToCount,
      currentUser: {
        name: currentUser.Full_name || currentUser.name,
        email: currentUser.email
      }
    });

  } catch (e: any) {
    const message = typeof e?.message === 'string' ? e.message : 'Failed to check reporting manager status';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
