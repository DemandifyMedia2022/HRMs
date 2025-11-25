import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    // Get HR emails
    const hrs = await prisma.$queryRaw<Array<{ email: string | null; name: string | null; department: string | null; type: string | null }>>`
      SELECT email, name, department, type FROM users 
      WHERE email IS NOT NULL AND (
        LOWER(department) = 'hr' OR UPPER(type) = 'HR'
      )
    `;

    // Get Admin emails  
    const admins = await prisma.$queryRaw<Array<{ email: string | null; name: string | null; department: string | null; type: string | null }>>`
      SELECT email, name, department, type FROM users 
      WHERE email IS NOT NULL AND (
        LOWER(type) = 'admin' OR UPPER(type) = 'ADMIN'
      )
    `;

    return NextResponse.json({
      hr_emails: hrs.map(h => ({
        email: h.email,
        name: h.name,
        department: h.department,
        type: h.type
      })),
      admin_emails: admins.map(a => ({
        email: a.email, 
        name: a.name,
        department: a.department,
        type: a.type
      }))
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
