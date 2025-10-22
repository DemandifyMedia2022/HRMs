export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import path from 'path';
import { promises as fs } from 'fs';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function saveFile(file: File, folder: string) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = path.extname(file.name) || '';
  const base = path.basename(file.name, ext).replace(/[^a-z0-9_-]/gi, '_');
  const hash = crypto.randomBytes(6).toString('hex');
  const filename = `${base}_${Date.now()}_${hash}${ext}`;
  const publicDir = path.join(process.cwd(), 'public', 'uploads', folder);
  await ensureDir(publicDir);
  const filePath = path.join(publicDir, filename);
  await fs.writeFile(filePath, buffer);
  // Return public URL path
  const publicPath = path.posix.join('/uploads', folder.replace(/\\/g, '/'), filename);
  return publicPath;
}

async function saveMaybeFile(form: FormData, field: string, folder: string) {
  const f = form.get(field);
  if (!f || !(f instanceof File) || !f.size) return null;
  return saveFile(f, folder);
}

async function saveMaybeFiles(form: FormData, field: string, folder: string) {
  const all = form.getAll(field).filter(x => x instanceof File && (x as File).size) as File[];
  const results: string[] = [];
  for (const file of all) {
    const url = await saveFile(file, folder);
    results.push(url);
  }
  return results;
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    // Basic fields
    const joining_date = String(form.get('join_date') || '');
    const Prefix = String(form.get('Prefix') || '');
    const name = String(form.get('name') || '');
    const Full_name = String(form.get('full_name') || '');
    const gender = String(form.get('gender') || '');
    const emp_code = String(form.get('emp_code') || '');
    const blood_group = String(form.get('blood_group') || '');
    const nationality = String(form.get('nationality') || '');
    const email = String(form.get('email') || '');
    const Personal_Email = String(form.get('personal_email') || '');
    const contact_no = String(form.get('contact_no') || '');
    const dob = String(form.get('dob') || '');
    const retirement_date = String(form.get('retirement_date') || '');
    const employment_type = String(form.get('employment_type') || '');
    const employment_status = String(form.get('employment_status') || '');
    const company_name = String(form.get('company') || '');
    const Business_unit = String(form.get('Business_unit') || '');
    const job_role = String(form.get('job_role') || '');
    const department = String(form.get('department') || '');
    const reporting_manager = String(form.get('reporting_manager') || '');
    const Functional_manager = String(form.get('Functional_manager') || '');
    const emp_address = String(form.get('emp_address') || '');
    const type = String(form.get('type') || 'user');
    const plainPassword = String(form.get('password') || '');

    if (!email || !plainPassword) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Hash password with bcrypt (cost 12) to match login route expectations
    let password = await bcrypt.hash(plainPassword, 12);
    // Normalize prefix for Laravel (expects $2y$). PHP can usually verify $2a/$2b, but normalize to be safe.
    if (password.startsWith('$2a$')) password = '$2y$' + password.slice(4);
    if (password.startsWith('$2b$')) password = '$2y$' + password.slice(4);

    // Enforce unique email before proceeding
    const existing = await prisma.users.findUnique({ where: { email } as any });
    if (existing) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }

    // Files
    const aadhaar_card = await saveMaybeFile(form, 'aadhaar_card', 'aadhaar');
    const pan_card = await saveMaybeFile(form, 'pan_card', 'pan');
    const marksheet = await saveMaybeFile(form, 'marksheet', 'marksheet');
    const certifications = await saveMaybeFile(form, 'certifications', 'certifications');
    const bankpassbook = await saveMaybeFile(form, 'bankpassbook', 'bankpassbook');
    const relieving_letter = await saveMaybeFile(form, 'relieving_letter', 'relieving');

    const pay_slips_arr = await saveMaybeFiles(form, 'pay_slips', 'payslips');
    const bank_statement_arr = await saveMaybeFiles(form, 'bank_statements', 'bankstatements');

    const now = new Date();

    const created = await prisma.users.create({
      data: {
        joining_date,
        Prefix,
        name,
        Full_name,
        gender,
        emp_code,
        blood_group,
        nationality,
        email,
        Personal_Email,
        contact_no,
        dob,
        retirement_date,
        employment_type,
        employment_status,
        company_name,
        Business_unit,
        job_role,
        department,
        reporting_manager,
        Functional_manager,
        emp_address,
        password,
        type,
        shift_time: null,
        email_verified_at: null,
        remember_token: null,
        updated_at: now,
        aadhaar_card: aadhaar_card ?? undefined,
        pan_card: pan_card ?? undefined,
        marksheet: marksheet ?? undefined,
        certifications: certifications ?? undefined,
        bankpassbook: bankpassbook ?? undefined,
        relieving_letter: relieving_letter ?? undefined,
        pay_slips: pay_slips_arr.length ? JSON.stringify(pay_slips_arr) : undefined,
        bank_statement: bank_statement_arr.length ? JSON.stringify(bank_statement_arr) : undefined
      },
      select: { id: true }
    });

    // Convert BigInt to string to avoid JSON serialization errors
    const createdId = typeof created.id === 'bigint' ? created.id.toString() : (created.id as any);
    return NextResponse.json({ id: createdId, ok: true }, { status: 201 });
  } catch (e: any) {
    console.error('/api/employees error:', e);
    const message = typeof e?.message === 'string' ? e.message : 'Failed to create employee';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
