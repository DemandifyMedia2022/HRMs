export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { requireAuth } from '@/lib/middleware';

function detectAudioType(buf: Buffer): 'webm' | 'ogg' | 'wav' | 'mp3' | null {
  if (buf.length >= 4 && buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) return 'webm'; // EBML
  if (buf.length >= 4 && buf.slice(0, 4).toString('ascii') === 'OggS') return 'ogg';
  if (buf.length >= 12 && buf.slice(0, 4).toString('ascii') === 'RIFF' && buf.slice(8, 12).toString('ascii') === 'WAVE') return 'wav';
  if (buf.length >= 3 && buf.slice(0, 3).toString('ascii') === 'ID3') return 'mp3';
  if (buf.length >= 2 && buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0) return 'mp3';
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'Missing file' }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const baseDir = path.join(process.cwd(), 'uploads', 'call-recordings');
    await fs.mkdir(baseDir, { recursive: true });
    const detected = detectAudioType(buffer);
    if (!detected) {
      return NextResponse.json({ error: 'Unsupported audio type' }, { status: 415 });
    }
    const safeName = String(file.name || `call_${Date.now()}.${detected}`).replace(/[^a-zA-Z0-9_.-]/g, '_');
    const fullPath = path.join(baseDir, safeName);
    await fs.writeFile(fullPath, buffer);

    const url = `/api/files/call-recordings/${safeName}`;
    return NextResponse.json({ url });
  } catch (err: any) {
    console.error('upload error', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
