export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import path from 'path';
import { promises as fs } from 'fs';
import crypto from 'crypto';
import { encryptPatch } from '@/lib/crypto';
import { requireRoles } from '@/lib/middleware';

// Allowlist of updatable fields in users table (Prisma model fields)
const ALLOWED: Record<string, true> = {
  Prefix: true,
  Full_name: true,
  emp_code: true,
  dob: true,
  gender: true,
  blood_group: true,
  nationality: true,
  email: true,
  Personal_Email: true,
  contact_no: true,
  Biometric_id: true,

  // Family / other
  father_name: true,
  father_dob: true,
  mother_name: true,
  mother_dob: true,
  marital_status: true,
  pan_card_no: true,
  adhar_card_no: true,
  passport_no: true,
  passport_expiry_date: true,
  emergency_contact: true,
  emergency_contact_name: true,
  emergency_relation: true,

  // Employment
  department: true,
  employment_status: true,
  employment_type: true,
  joining_date: true,
  retirement_date: true,

  // Position
  company_name: true,
  Business_unit: true,
  job_role: true,
  reporting_manager: true,
  Functional_manager: true,

  // Bank
  salary_pay_mode: true,
  bank_name: true,
  branch: true,
  IFSC_code: true,
  Account_no: true,
  UAN: true,
  reimbursement_pay_mode: true,
  reimbursement_bank_name: true,
  reimbursement_branch: true,
  reimbursement_ifsc_code: true,
  reimbursement_account_no: true,

  // Health insurance
  insurance_company: true,
  assured_sum: true,
  insuree_name: true,
  relationship: true,
  insuree_dob: true,
  insuree_gender: true,
  insuree_code: true,
  // Children
  child_name: true,
  child_dob: true,
  child_gender: true
};

// Sensitive fields to encrypt at rest (bank + IDs/other PII shown in UI forms)
const SENSITIVE_FIELDS = new Set<string>([
  // Bank
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
  // Other IDs
  'pan_card_no',
  'adhar_card_no',
  'passport_no',
  'emergency_contact',
  'emergency_contact_name',
  'emergency_relation'
]);

function detectAllowed(buf: Buffer): 'pdf' | 'png' | 'jpg' | 'jpeg' | 'webp' | null {
  if (buf.length >= 5 && buf.slice(0, 5).toString('ascii') === '%PDF-') return 'pdf';
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 && buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a) return 'png';
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.length >= 12 && buf.slice(8, 12).toString('ascii') === 'WEBP') return 'webp';
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const auth = requireRoles(req, 'admin', 'hr');
    if (auth instanceof NextResponse) return auth;
    const contentType = req.headers.get('content-type') || '';
    // Branch: multipart form for document uploads
    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData();
      const employee_id_raw = form.get('employee_id');
      const id = Number(employee_id_raw);
      if (!id) return NextResponse.json({ error: 'Missing employee_id' }, { status: 400 });
      // Resolve employee to create a per-user subfolder
      const emp = await prisma.users.findUnique({ where: { id: BigInt(id) } as any });
      const empName = (emp as any)?.name || (emp as any)?.Full_name || `user_${id}`;
      const userSlug = String(empName)
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_-]/g, '_');

      async function ensureDir(dir: string) {
        await fs.mkdir(dir, { recursive: true });
      }
      async function saveFile(file: File, folder: string) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const kind = detectAllowed(buffer);
        if (!kind) throw new Error('Unsupported file type');
        const ext = path.extname(file.name) || '';
        const base = path.basename(file.name, ext).replace(/[^a-z0-9_-]/gi, '_');
        const hash = crypto.randomBytes(6).toString('hex');
        const filename = `${base}_${Date.now()}_${hash}${ext}`;
        const privateDir = path.join(process.cwd(), 'uploads', 'uploads', userSlug, folder);
        await ensureDir(privateDir);
        const filePath = path.join(privateDir, filename);
        await fs.writeFile(filePath, buffer);
        const urlPath = path.posix.join('/api/files/uploads', userSlug, folder.replace(/\\/g, '/'), filename);
        return urlPath;
      }

      function getFile(form: FormData, field: string): File | null {
        const f = form.get(field);
        if (!f || !(f instanceof File) || !f.size) return null;
        return f;
      }
      function getFiles(form: FormData, field: string): File[] {
        return form.getAll(field).filter(x => x instanceof File && (x as File).size) as File[];
      }

      const updates: any = {};
      const singleFiles: Array<[key: string, folder: string]> = [
        ['aadhaar_card', 'aadhaar'],
        ['pan_card', 'pan'],
        ['bankpassbook', 'bankpassbook'],
        ['relieving_letter', 'relieving'],
        ['certifications', 'certifications'],
        ['marksheet', 'marksheet']
      ];
      for (const [field, folder] of singleFiles) {
        const f = getFile(form, field);
        if (f) updates[field] = await saveFile(f, folder);
      }

      // Support multiple uploads for pay_slips and bank_statements
      const pays = getFiles(form, 'pay_slips');
      if (pays.length) {
        const urls: string[] = [];
        for (const f of pays) urls.push(await saveFile(f, 'payslips'));
        updates.pay_slips = JSON.stringify(urls);
      }
      const banks = getFiles(form, 'bank_statements');
      if (banks.length) {
        const urls: string[] = [];
        for (const f of banks) urls.push(await saveFile(f, 'bankstatements'));
        updates.bank_statement = JSON.stringify(urls);
      }

      if (Object.keys(updates).length === 0) {
        return NextResponse.json({ error: 'No documents provided' }, { status: 400 });
      }

      await prisma.users.update({ where: { id: BigInt(id) } as any, data: updates });
      return NextResponse.json({ ok: true });
    }

    // JSON branch for field updates
    const body = await req.json().catch(() => ({}));
    const employee_id_raw = body?.employee_id;
    const patch = body?.data || {};
    const id = Number(employee_id_raw);
    if (!id) return NextResponse.json({ error: 'Missing employee_id' }, { status: 400 });
    if (!patch || typeof patch !== 'object') {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    // Fields that are DateTime in Prisma and need Date objects
    const DATE_FIELDS: Record<string, true> = {
      father_dob: true,
      mother_dob: true,
      insuree_dob: true,
      passport_expiry_date: true,
      child_dob: true
    };

    // Build update object using allowed keys only
    const data: any = {};
    for (const [k, v] of Object.entries(patch)) {
      if (ALLOWED[k]) {
        // Normalize empty strings to null for date-like and optional fields
        if (v === '') {
          data[k] = null;
        } else {
          if (DATE_FIELDS[k] && typeof v === 'string') {
            const val = v.trim();
            // Support YYYY-MM-DD by converting to Date at midnight UTC
            const parsed = new Date(val.length <= 10 ? `${val}T00:00:00Z` : val);
            if (!isNaN(parsed.getTime())) {
              data[k] = parsed;
            } else {
              // If invalid date string provided, set null to avoid Prisma crash
              data[k] = null;
            }
          } else {
            data[k] = v;
          }
        }
      }
    }

    // Encrypt sensitive fields before saving
    const secured = encryptPatch(data, SENSITIVE_FIELDS);

    if (Object.keys(secured).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    await prisma.users.update({ where: { id: BigInt(id) } as any, data: secured });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('/api/hr/employees/update error:', e);
    const msg = typeof e?.message === 'string' ? e.message : 'Failed to update employee';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}