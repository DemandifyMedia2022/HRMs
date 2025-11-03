export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { requireAuth } from '@/lib/middleware';

const uploadDir = path.join(process.cwd(), 'uploads', 'campaign-scripts');

function isPdf(buffer: Buffer): boolean {
  // PDF files start with '%PDF-'
  if (buffer.length < 5) return false;
  return buffer.slice(0, 5).toString('ascii') === '%PDF-';
}

export async function POST(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;
    const form = await req.formData();
    const file = form.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'file is required' }, { status: 400 });

    await fs.mkdir(uploadDir, { recursive: true });

    const arrayBuffer = await file.arrayBuffer();
    const buf = Buffer.from(arrayBuffer);
    // Validate: allow only PDF
    if (!isPdf(buf)) {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 415 });
    }
    const safeName = `${Date.now()}-${(file.name || 'script.pdf').replace(/[^a-zA-Z0-9_.-]+/g, '_')}`;
    const filePath = path.join(uploadDir, safeName);
    await fs.writeFile(filePath, buf);

    const url = `/api/files/campaign-scripts/${safeName}`;
    return NextResponse.json({ url });
  } catch (err: any) {
    console.error('campaign script upload error', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
