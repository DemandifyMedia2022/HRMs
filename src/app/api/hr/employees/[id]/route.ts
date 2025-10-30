import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decryptRecord } from '@/lib/crypto';

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const idNum = Number(id);
    if (!idNum) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    const user = await prisma.users.findUnique({ where: { id: BigInt(idNum) } as any });
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Convert BigInt fields to Number for safe JSON serialization
    const plain = Object.fromEntries(
      Object.entries(user as Record<string, any>).map(([k, v]) => [k, typeof v === 'bigint' ? Number(v) : v])
    );
 
    // Fields encrypted at rest
    const SENSITIVE_FIELDS = new Set<string>([
      'salary_pay_mode',
      'bank_name',
      'branch',
      'IFSC_code',
      'Account_no',
      'UAN',
      'reimbursement_pay_mode',
      'reimbursement_bank_name',
      'reimbursement_branch',
      'reimbursement_ifsc_code',
      'reimbursement_account_no',
      'pan_card_no',
      'adhar_card_no',
      'passport_no',
      'emergency_contact',
      'emergency_contact_name',
      'emergency_relation'
    ]);
 
    const decrypted = decryptRecord(plain, SENSITIVE_FIELDS);
    return NextResponse.json(decrypted);
  } catch (e: any) {
    console.error('/api/hr/employees/[id] error:', e);
    return NextResponse.json({ error: 'Failed to load employee' }, { status: 500 });
  }
}