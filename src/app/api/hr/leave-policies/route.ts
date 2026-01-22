import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// GET /api/hr/leave-policies?client_company_name=Acme Inc
export async function GET(request: NextRequest) {
  try {
    const cookies = request.cookies;
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');

    let token: string | null = null;
    if (cookies.has('access_token')) token = cookies.get('access_token')?.value || null;
    if (!token && authHeader && authHeader.startsWith('Bearer ')) token = authHeader.slice(7);
    if (!token) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

    let user;
    try {
      user = verifyToken(token);
      if (user.role !== 'hr' && user.role !== 'admin') {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
    }

    // Resolve logged-in user's company strictly
    const dbUser = await (prisma as any).users.findUnique({ where: { email: user.email } });
    const company = dbUser?.client_company_name as string | null;
    if (!company) {
      return NextResponse.json({ success: false, error: 'No company associated with user' }, { status: 400 });
    }

    const policy = await prisma.company_leave_policies.findFirst({ where: { client_company_name: company } });

    return NextResponse.json({ success: true, data: policy || null, company });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to fetch leave policy', details: error.message }, { status: 500 });
  }
}

// POST /api/hr/leave-policies  (upsert by client_company_name)
export async function POST(request: NextRequest) {
  try {
    const cookies = request.cookies;
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');

    let token: string | null = null;
    if (cookies.has('access_token')) token = cookies.get('access_token')?.value || null;
    if (!token && authHeader && authHeader.startsWith('Bearer ')) token = authHeader.slice(7);
    if (!token) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

    let user;
    try {
      user = verifyToken(token);
      if (user.role !== 'hr' && user.role !== 'admin') {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
    }

    const body = await request.json();

    // Resolve company of the logged-in user; do not allow cross-company
    const dbUser = await (prisma as any).users.findUnique({ where: { email: user.email } });
    const company = (dbUser?.client_company_name as string | null) || null;
    if (!company) {
      return NextResponse.json({ success: false, error: 'No company associated with user' }, { status: 400 });
    }

    const data = {
      client_company_name: company,
      total_paid_leave: body.total_paid_leave != null ? Number(body.total_paid_leave) : null,
      total_sick_leave: body.total_sick_leave != null ? Number(body.total_sick_leave) : null,
      accrual: body.accrual != null ? String(body.accrual) : null,
      carryover_paid: body.carryover_paid != null ? Number(body.carryover_paid) : null,
      carryover_sick: body.carryover_sick != null ? Number(body.carryover_sick) : null,
      updated_at: new Date(),
      created_at: new Date()
    } as any;

    const existing = await prisma.company_leave_policies.findFirst({ where: { client_company_name: company } });

    let result;
    if (existing) {
      result = await prisma.company_leave_policies.update({
        where: { id: existing.id },
        data: {
          total_paid_leave: data.total_paid_leave,
          total_sick_leave: data.total_sick_leave,
          accrual: data.accrual,
          carryover_paid: data.carryover_paid,
          carryover_sick: data.carryover_sick,
          updated_at: new Date()
        }
      });
    } else {
      result = await prisma.company_leave_policies.create({ data });
    }

    return NextResponse.json({ success: true, message: 'Leave policy saved', data: result, company });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to save leave policy', details: error.message }, { status: 500 });
  }
}
