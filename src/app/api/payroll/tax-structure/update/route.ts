import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { handleError } from '@/lib/error-handler';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const userId = body.SelectUser;
    if (!userId) {
      return NextResponse.json({ success: false, message: 'User ID required' }, { status: 400 });
    }

    // Remove SelectUser from data
    const { SelectUser, ...taxData } = body;

    // Fetch user details
    const user = await (prisma as any).$queryRawUnsafe(`SELECT Full_name, emp_code FROM users WHERE id = ?`, userId);

    if (!user || user.length === 0) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    taxData.Full_name = user[0].Full_name;
    taxData.emp_code = user[0].emp_code;

    // Whitelist allowed fields and sanitize input
    const allowedFields = [
      'Full_name',
      'emp_code',
      'basic_salary',
      'hra',
      'transport_allowance',
      'medical_allowance',
      'other_allowances',
      'pf_contribution',
      'esi_contribution',
      'professional_tax',
      'income_tax',
      'other_deductions'
    ];

    const sanitizedData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (field in taxData && (taxData as any)[field] !== undefined) {
        (sanitizedData as any)[field] = (taxData as any)[field];
      }
    }

    // Check if record exists
    const existing = await (prisma as any).$queryRawUnsafe(`SELECT * FROM Tax WHERE user_id = ?`, userId);

    if (existing && existing.length > 0) {
      // Update
      if (Object.keys(sanitizedData).length === 0) {
        return NextResponse.json({ success: false, message: 'No valid fields to update' }, { status: 400 });
      }
      const fields = Object.keys(sanitizedData)
        .map(k => `${k} = ?`)
        .join(', ');
      const values = [...Object.values(sanitizedData), userId];
      await (prisma as any).$queryRawUnsafe(`UPDATE Tax SET ${fields} WHERE user_id = ?`, ...values);
    } else {
      // Insert
      const insertFields = [...Object.keys(sanitizedData), 'user_id'];
      const placeholders = insertFields.map(() => '?').join(', ');
      const insertValues = [...Object.values(sanitizedData), userId];
      await (prisma as any).$queryRawUnsafe(
        `INSERT INTO Tax (${insertFields.join(', ')}) VALUES (${placeholders})`,
        ...insertValues
      );
    }

    return NextResponse.json({ success: true, message: 'Tax structure updated successfully' });
  } catch (error: any) {
    return handleError(error, request);
  }
}
