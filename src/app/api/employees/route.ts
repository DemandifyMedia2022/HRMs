export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import path from 'path';
import { promises as fs } from 'fs';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { sendMail } from '@/lib/mailer';
import { encryptField } from '@/lib/crypto';

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

    // Bank and other PII (optional on create; encrypt at rest if provided)
    const salary_pay_mode = String(form.get('salary_pay_mode') || '');
    const bank_name = String(form.get('bank_name') || '');
    const branch = String(form.get('branch') || '');
    const IFSC_code = String(form.get('IFSC_code') || '');
    const Account_no = String(form.get('Account_no') || '');
    const UAN = String(form.get('UAN') || '');
    const reimbursement_pay_mode = String(form.get('reimbursement_pay_mode') || '');
    const reimbursement_bank_name = String(form.get('reimbursement_bank_name') || '');
    const reimbursement_branch = String(form.get('reimbursement_branch') || '');
    const reimbursement_ifsc_code = String(form.get('reimbursement_ifsc_code') || '');
    const reimbursement_account_no = String(form.get('reimbursement_account_no') || '');
    const pan_card_no = String(form.get('pan_card_no') || '');
    const adhar_card_no = String(form.get('adhar_card_no') || '');
    const passport_no = String(form.get('passport_no') || '');
    const emergency_contact = String(form.get('emergency_contact') || '');
    const emergency_contact_name = String(form.get('emergency_contact_name') || '');
    const emergency_relation = String(form.get('emergency_relation') || '');

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
        bank_statement: bank_statement_arr.length ? JSON.stringify(bank_statement_arr) : undefined,
        // Encrypted at rest (only set if provided)
        salary_pay_mode: salary_pay_mode ? encryptField(salary_pay_mode) : undefined,
        bank_name: bank_name ? encryptField(bank_name) : undefined,
        branch: branch ? encryptField(branch) : undefined,
        IFSC_code: IFSC_code ? encryptField(IFSC_code) : undefined,
        Account_no: Account_no ? encryptField(Account_no) : undefined,
        UAN: UAN ? encryptField(UAN) : undefined,
        reimbursement_pay_mode: reimbursement_pay_mode ? encryptField(reimbursement_pay_mode) : undefined,
        reimbursement_bank_name: reimbursement_bank_name ? encryptField(reimbursement_bank_name) : undefined,
        reimbursement_branch: reimbursement_branch ? encryptField(reimbursement_branch) : undefined,
        reimbursement_ifsc_code: reimbursement_ifsc_code ? encryptField(reimbursement_ifsc_code) : undefined,
        reimbursement_account_no: reimbursement_account_no ? encryptField(reimbursement_account_no) : undefined,
        pan_card_no: pan_card_no ? encryptField(pan_card_no) : undefined,
        adhar_card_no: adhar_card_no ? encryptField(adhar_card_no) : undefined,
        passport_no: passport_no ? encryptField(passport_no) : undefined,
        emergency_contact: emergency_contact ? encryptField(emergency_contact) : undefined,
        emergency_contact_name: emergency_contact_name ? encryptField(emergency_contact_name) : undefined,
        emergency_relation: emergency_relation ? encryptField(emergency_relation) : undefined
      },
      select: { id: true }
    });

    const createdId = typeof created.id === 'bigint' ? created.id.toString() : (created.id as any);

    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
      const forgotLink = `${appUrl}/forgot-password?email=${encodeURIComponent(email)}`;
      const org = company_name || 'HRMS';
      const html = `
        <div style="font-family:ui-sans-serif,system-ui,-apple-system;max-width:560px;margin:auto">
          <h2 style="margin:0 0 8px">Welcome to ${org}</h2>
          <p style="margin:0 0 16px">Hi ${name || 'Employee'}, your account has been created.</p>
          <ul style="margin:0 0 16px;padding-left:20px">
            <li>Email: <strong>${email}</strong></li>
            ${emp_code ? `<li>Employee Code: <strong>${emp_code}</strong></li>` : ''}
            ${department ? `<li>Department: <strong>${department}</strong></li>` : ''}
          </ul>
          <p style="margin:0 0 16px">To set your password, request a one-time password (OTP) using the link below:</p>
          <p style="margin:0 0 16px"><a href="${forgotLink}" target="_blank">Generate OTP and set your password</a></p>
          <p style="color:#64748b;margin:0">If you did not expect this email, you can ignore it.</p>
        </div>
      `;
      await sendMail({ to: [email], subject: `${org}: Your account and password setup`, html });
    } catch {}

    return NextResponse.json({ id: createdId, ok: true }, { status: 201 });
  } catch (e: any) {
    console.error('/api/employees error:', e);
    const message = typeof e?.message === 'string' ? e.message : 'Failed to create employee';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}