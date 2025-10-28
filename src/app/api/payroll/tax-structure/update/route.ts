import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

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

    // Check if record exists
    const existing = await (prisma as any).$queryRawUnsafe(`SELECT * FROM Tax WHERE user_id = ?`, userId);

    if (existing && existing.length > 0) {
      // Update
      const fields = Object.keys(taxData)
        .map(k => `${k} = ?`)
        .join(', ');
      const values = [...Object.values(taxData), userId];
      await (prisma as any).$queryRawUnsafe(`UPDATE Tax SET ${fields} WHERE user_id = ?`, ...values);
    } else {
      // Insert
      taxData.user_id = userId;
      const fields = Object.keys(taxData).join(', ');
      const placeholders = Object.keys(taxData)
        .map(() => '?')
        .join(', ');
      await (prisma as any).$queryRawUnsafe(
        `INSERT INTO Tax (${fields}) VALUES (${placeholders})`,
        ...Object.values(taxData)
      );
    }

    return NextResponse.json({ success: true, message: 'Tax structure updated successfully' });
  } catch (error: any) {
    console.error('Tax update error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
