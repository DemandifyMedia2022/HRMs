export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const uploadDir = path.join(process.cwd(), 'public', 'campaign-scripts');

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'file is required' }, { status: 400 });

    await fs.mkdir(uploadDir, { recursive: true });

    const arrayBuffer = await file.arrayBuffer();
    const buf = Buffer.from(arrayBuffer);
    const safeName = `${Date.now()}-${(file.name || 'script').replace(/[^a-zA-Z0-9_.-]+/g, '_')}`;
    const filePath = path.join(uploadDir, safeName);
    await fs.writeFile(filePath, buf);

    const url = `/campaign-scripts/${safeName}`;
    return NextResponse.json({ url });
  } catch (err: any) {
    console.error('campaign script upload error', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
