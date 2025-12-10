export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { promises as fsp } from 'fs';
import { statSync } from 'fs';
import { requireAuth } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';

function detectContentType(buf: Buffer): string {
  // Minimal magic-bytes detection
  if (buf.length >= 5 && buf.slice(0, 5).toString('ascii') === '%PDF-') return 'application/pdf';
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 && buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a) return 'image/png';
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.length >= 12 && buf.slice(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  if (buf.length >= 4 && buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) return 'video/webm';
  if (buf.length >= 4 && buf.slice(0, 4).toString('ascii') === 'OggS') return 'audio/ogg';
  if (buf.length >= 12 && buf.slice(0, 4).toString('ascii') === 'RIFF' && buf.slice(8, 12).toString('ascii') === 'WAVE') return 'audio/wav';
  if (buf.length >= 3 && buf.slice(0, 3).toString('ascii') === 'ID3') return 'audio/mpeg';
  if (buf.length >= 2 && buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0) return 'audio/mpeg';
  return 'application/octet-stream';
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { path: parts } = await ctx.params;
    if (!Array.isArray(parts) || !parts.length) {
      return NextResponse.json({ error: 'Missing file path' }, { status: 400 });
    }

    const baseDir = path.join(process.cwd(), 'uploads');
    const requested = path.join(...parts);
    const abs = path.resolve(baseDir, requested);
    if (!abs.startsWith(path.resolve(baseDir))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Authorization: non-admin/hr can only access their own uploads subfolder or task attachments
    if (auth.role !== 'admin' && auth.role !== 'hr') {
      const tasksDir = path.resolve(baseDir, 'tasks');
      const isTaskAttachment = abs.startsWith(tasksDir);

      if (isTaskAttachment) {
        // For task attachments, verify user has access to the task's department
        // Extract task number from path: uploads/tasks/[task_number]/[filename]
        const relativePath = path.relative(tasksDir, abs);
        const taskNumber = relativePath.split(path.sep)[0];

        if (taskNumber) {
          try {
            const task = await prisma.tasks.findFirst({
              where: { task_number: taskNumber },
              select: { department: true }
            });

            if (!task || task.department !== auth.department) {
              return NextResponse.json({ error: 'Forbidden - File access denied' }, { status: 403 });
            }
          } catch {
            return NextResponse.json({ error: 'Forbidden - File access denied' }, { status: 403 });
          }
        }
      } else {
        // For user uploads, check user-specific folder
        let userSlug = 'user';
        let isProfileImage = false;

        try {
          const user = await prisma.users.findUnique({ where: { id: BigInt(auth.id) } as any });
          const name = (user as any)?.Full_name || (user as any)?.name || '';
          userSlug = String(name)
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '_')
            .replace(/[^a-z0-9_-]/g, '_') || 'user';

          // Check if this file is the user's profile image
          // requested path e.g. "soham_pawar/profile_123.jpg"
          // stored path e.g. "soham_pawar/profile_123.jpg"
          // If the requested path matches EXACTLY what is in the DB for THIS user, allow it.
          // OR, if the file is a user's current profile image, allow it regardless of folder (for other users to see)
          // BUT, fetching "other users" profile images requires verifying that the file is indeed PROCLAIMED as a profile image in the DB.

          // Let's first enable the OWNER to see it by fixing the slug.
          // Secondly, let's enable OTHERS to see it by checking strictly against the DB.

          const requestedPathStr = parts.join('/');

          // Check if this specific file is ANY user's profile image
          const owner = await (prisma.users as any).findFirst({
            where: { profile_image: requestedPathStr }
          });

          if (owner) {
            isProfileImage = true;
          }

        } catch { }

        const userDir = path.resolve(baseDir, path.join('uploads', userSlug));

        // Allow if it is a confirmed profile image OR if it is in the user's own directory
        if (!isProfileImage && !abs.startsWith(userDir)) {
          return NextResponse.json({ error: 'Forbidden - File access denied' }, { status: 403 });
        }
      }
    }

    // Ensure file exists and is a file
    let st: { isFile: () => boolean; size: number } | null = null;
    try {
      st = statSync(abs);
    } catch { }
    if (!st || !st.isFile()) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Read small head for content type detection
    const fh = await fsp.open(abs, 'r');
    const head = Buffer.alloc(64);
    await fh.read(head, 0, head.length, 0);
    await fh.close();
    const contentType = detectContentType(head);

    // Enforce download disposition to avoid inline execution (prevents stored XSS via HTML/SVG)
    const filename = parts[parts.length - 1] || 'file';

    // For simplicity and reliability in App Router, read into memory
    const data = await fsp.readFile(abs);
    const res = new NextResponse(new Uint8Array(data), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(st.size),
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Cache-Control': 'private, max-age=0, no-cache'
      }
    });
    return res;
  } catch (e: any) {
    console.error('files GET error', e);
    return NextResponse.json({ error: 'Failed to read file' }, { status: 500 });
  }
}
