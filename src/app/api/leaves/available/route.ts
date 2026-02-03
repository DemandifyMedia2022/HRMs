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
    const month = searchParams.get('month'); // YYYY-MM; if null, default to current month for table
    if (!userName) {
      return NextResponse.json({ error: 'Missing user_name' }, { status: 400 });
    }

    // 1) Resolve the exact user (email/name) and their company from users
    let resolvedCompany: string | null = null;
    let displayNameOptions: string[] = []; // exact values to match in leavedata.added_by_user
    let resolvedEmpCode: string | null = null;
    let resolvedTokens: string[] = [];

    try {
      const isEmail = userName.includes('@');
      const local = isEmail ? userName.split('@')[0] : userName;
      const tokens = local.split(/[._\s]+/).filter(Boolean);
      resolvedTokens = tokens;

      const user = await prisma.users.findFirst({
        where: isEmail
          ? { email: userName }
          : tokens.length
          ? { AND: tokens.map(t => ({ OR: [{ name: { contains: t } }, { Full_name: { contains: t } }] })) }
          : { OR: [{ name: userName }, { Full_name: userName }] },
        select: { client_company_name: true, email: true, name: true, Full_name: true, emp_code: true }
      });

      resolvedCompany = user?.client_company_name ?? null;
      resolvedEmpCode = user?.emp_code ? String(user.emp_code) : null;

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

    // 3) Per-user filter using strong identifier (emp_code) when available.
    // Keep a company guard for name-based matching, but allow legacy rows with null company
    // when emp_code matches (older records / failed company resolution on create).
    const orUser: any[] = [];
    if (resolvedEmpCode) {
      orUser.push({ emp_code: resolvedEmpCode });
    }
    if (displayNameOptions.length > 0) {
      orUser.push(...displayNameOptions.map(v => ({ added_by_user: v })));
    }

    // Fallback: match on name tokens (helps when added_by_user has different formatting)
    // Still scoped by company below to avoid cross-user leakage.
    if (resolvedTokens.length > 0) {
      orUser.push({
        AND: resolvedTokens.map(t => ({
          added_by_user: { contains: t } as any
        }))
      });
    }

    const andFilters: any[] = [];
    if (orUser.length > 0) {
      andFilters.push({ OR: orUser });
    }
    if (resolvedCompany) {
      if (resolvedEmpCode) {
        andFilters.push({ OR: [{ client_company_name: resolvedCompany }, { client_company_name: null }] });
      } else {
        andFilters.push({ client_company_name: resolvedCompany });
      }
    }
    const whereUser = andFilters.length ? { AND: andFilters } : {};

    // Current-year window for the Approved count
    const now = new Date();
    const year = now.getUTCFullYear();
    const yearStart = new Date(Date.UTC(year, 0, 1));
    const yearEnd = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

    // Determine month window for LeaveApprovalData (table)
    let monthStart: Date | null = null;
    let monthEnd: Date | null = null;
    if (month) {
      const [y, m] = month.split('-');
      const yearNum = Number(y);
      const monthNum = Number(m) - 1;
      if (!isNaN(yearNum) && !isNaN(monthNum)) {
        monthStart = new Date(Date.UTC(yearNum, monthNum, 1));
        monthEnd = new Date(Date.UTC(yearNum, monthNum + 1, 0, 23, 59, 59, 999));
      }
    } else {
      // Default to current month for the table
      const currentYear = now.getUTCFullYear();
      const currentMonth = now.getUTCMonth();
      monthStart = new Date(Date.UTC(currentYear, currentMonth, 1));
      monthEnd = new Date(Date.UTC(currentYear, currentMonth + 1, 0, 23, 59, 59, 999));
    }

    // all leaves for the user (table) - default to current month unless month param is provided
    const allLeaves = await prisma.leavedata.findMany({
      where: {
        ...(whereUser as any),
        ...(monthStart && monthEnd ? { start_date: { gte: monthStart, lte: monthEnd } } : {})
      },
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
      } else if (leave.leave_type === 'Maternity Leave') {
        // Maternity leave typically has separate policies, track separately if needed
        // For now, we can track it as paid leave or add separate tracking
        usedPaidLeave += days;
      } else if (leave.leave_type === 'Paternity Leave') {
        // Paternity leave typically has separate policies, track separately if needed
        // For now, we can track it as paid leave or add separate tracking
        usedPaidLeave += days;
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