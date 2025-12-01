import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
 
// GET /api/payroll/tax-structure
// Mirrors Laravel: DB::table('Tax')->get(); with optional ?search=
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim();
 
    let rows: any[] = [];
 
    if (search) {
      // Parameterized raw query to avoid SQL injection
      rows = await (prisma as any).$queryRawUnsafe(
        `SELECT * FROM tax WHERE Full_name LIKE ? OR emp_code LIKE ? OR user_id LIKE ?`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`
      );
    } else {
      rows = await (prisma as any).$queryRawUnsafe(`SELECT * FROM tax`);
    }
 
    // Normalize bigint fields to string (user_id/id may be bigint depending on DB)
    const data = rows.map((r: any) => {
      const o: Record<string, any> = {};
      for (const k of Object.keys(r)) {
        const v = (r as any)[k];
        o[k] = typeof v === 'bigint' ? v.toString() : v;
      }
      return o;
    });
 
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('tax-structure GET error', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch tax structure' }, { status: 500 });
  }
}