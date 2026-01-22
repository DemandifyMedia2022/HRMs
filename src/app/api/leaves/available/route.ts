import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function workingDaysBetween(start: Date, end: Date): number {
  // inclusive range, exclude Sat(6)/Sun(0)
  let count = 0;
  const cur = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  const last = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
  while (cur <= last) {
    const day = cur.getUTCDay();
    if (day !== 0 && day !== 6) count++;
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return count;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userName = searchParams.get('user_name') || searchParams.get('added_by_user');
    if (!userName) {
      return NextResponse.json({ error: 'Missing user_name' }, { status: 400 });
    }

    // 1) Resolve the exact user (email/name) and their company from users
    let resolvedCompany: string | null = null;
    let displayNameOptions: string[] = []; // exact values to match in leavedata.added_by_user

    try {
      const isEmail = userName.includes('@');
      const local = isEmail ? userName.split('@')[0] : userName;
      const tokens = local.split(/[._\s]+/).filter(Boolean);

      const user = await prisma.users.findFirst({
        where: isEmail
          ? { email: userName }
          : tokens.length
          ? { AND: tokens.map(t => ({ OR: [{ name: { contains: t } }, { Full_name: { contains: t } }] })) }
          : { OR: [{ name: userName }, { Full_name: userName }] },
        select: { client_company_name: true, email: true, name: true, Full_name: true }
      });

      resolvedCompany = user?.client_company_name ?? null;

      const candidates = [
        user?.email,
        user?.Full_name,
        user?.name,
        userName // include the incoming identifier too
      ]
        .map(v => (typeof v === 'string' ? v.trim() : ''))
        .filter(Boolean);

      displayNameOptions = Array.from(new Set(candidates));
    } catch {
      displayNameOptions = [userName];
    }

    // 2) Company policy totals (fallback to 12/6)
    let totalPaidLeave = 12;
    let totalSickLeave = 6;

    if (resolvedCompany) {
      const dbPolicy = await prisma.company_leave_policies.findFirst({
        where: { client_company_name: resolvedCompany }
      });
      if (dbPolicy) {
        if (typeof dbPolicy.total_paid_leave === 'number') totalPaidLeave = dbPolicy.total_paid_leave;
        if (typeof dbPolicy.total_sick_leave === 'number') totalSickLeave = dbPolicy.total_sick_leave;
      }
    }

    // 3) STRICT per-user filter + company guard (prevents same-name collisions)
    const andFilters: any[] = [];
    if (displayNameOptions.length > 0) {
      andFilters.push({ OR: displayNameOptions.map(v => ({ added_by_user: v })) });
    }
    if (resolvedCompany) {
      andFilters.push({ client_company_name: resolvedCompany });
    }
    const whereUser = andFilters.length ? { AND: andFilters } : {};

    // Current-year window for the Approved count
    const now = new Date();
    const year = now.getUTCFullYear();
    const yearStart = new Date(Date.UTC(year, 0, 1));
    const yearEnd = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

    // all leaves for the user (table) - keep full history
    const allLeaves = await prisma.leavedata.findMany({
      where: whereUser as any,
      orderBy: { start_date: 'desc' }
    });

    // approved leaves for balances (BOTH approvals) and current year only
    const approvedLeaves = await prisma.leavedata.findMany({
      where: {
        ...(whereUser as any),
        HRapproval: { in: ['approved', 'Approved', 'APPROVED'] } as any,
        Managerapproval: { in: ['approved', 'Approved', 'APPROVED'] } as any,
        start_date: { gte: yearStart, lte: yearEnd }
      },
      orderBy: { start_date: 'desc' }
    });

    // Your original deduction logic
    let usedPaidLeave = 0;
    let usedSickLeave = 0;

    for (const leave of approvedLeaves) {
      const start = new Date(leave.start_date as any);
      const end = new Date(leave.end_date as any);
      const days = workingDaysBetween(start, end);

      if (leave.leave_type === 'Paid Leave') {
        usedPaidLeave += days;
      } else if (leave.leave_type === 'Sick Leave(HalfDay)') {
        usedSickLeave += 0.5 * days;
      } else if (leave.leave_type === 'Sick Leave(FullDay)') {
        usedSickLeave += 1 * days;
      }
    }


    const viewerName = searchParams.get('viewer_name'); // optional

if (viewerName) {
  try {
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

    const viewerCompany = viewer?.client_company_name ?? null;
    if (viewerCompany && resolvedCompany && viewerCompany !== resolvedCompany) {
      return NextResponse.json(
        { error: 'Forbidden: cross-company access is not allowed' },
        { status: 403 }
      );
    }
  } catch {
    return NextResponse.json({ error: 'Forbidden: cannot resolve viewer' }, { status: 403 });
  }
}

    const remainingPaidLeave = Math.max(0, totalPaidLeave - usedPaidLeave);
    const remainingSickLeave = Math.max(0, totalSickLeave - usedSickLeave);

    return NextResponse.json({
      approvedLeaves,             // strictly for logged user, both approvals, current year
      LeaveApprovalData: allLeaves,
      usedPaidLeave,
      usedSickLeave,
      remainingPaidLeave,
      remainingSickLeave,
      totals: { totalPaidLeave, totalSickLeave }, // from company policy
      company: resolvedCompany || 'Default',
      user: userName
    });
  } catch (e: any) {
    const message = typeof e?.message === 'string' ? e.message : 'Failed to compute available leaves';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}