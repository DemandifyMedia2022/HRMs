import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed file types (magic bytes detection)
function detectFileType(buffer: Buffer): { type: string; ext: string } | null {
  // PDF
  if (buffer.length >= 5 && buffer.slice(0, 5).toString('ascii') === '%PDF-') {
    return { type: 'application/pdf', ext: '.pdf' };
  }
  // PNG
  if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return { type: 'image/png', ext: '.png' };
  }
  // JPEG
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { type: 'image/jpeg', ext: '.jpg' };
  }
  // WEBP
  if (buffer.length >= 12 && buffer.slice(8, 12).toString('ascii') === 'WEBP') {
    return { type: 'image/webp', ext: '.webp' };
  }
  // ZIP
  if (buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04) {
    return { type: 'application/zip', ext: '.zip' };
  }
  // DOCX (also ZIP-based)
  if (buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b) {
    return { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', ext: '.docx' };
  }
  // TXT (simple heuristic - all printable ASCII)
  if (buffer.length > 0 && buffer.slice(0, Math.min(512, buffer.length)).every(b => (b >= 32 && b <= 126) || b === 9 || b === 10 || b === 13)) {
    return { type: 'text/plain', ext: '.txt' };
  }
  
  return null;
}

// GET /api/tasks/[id]/attachments - List attachments
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const taskId = BigInt(id);

    // Check if task exists and user has access
    const task = await prisma.tasks.findUnique({
      where: { id: taskId },
      select: { id: true, department: true }
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    // Check access
    if (auth.role !== 'admin' && task.department !== auth.department) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Fetch attachments
    const attachments = await prisma.task_attachments.findMany({
      where: { task_id: taskId },
      include: {
        users: {
          select: {
            id: true,
            Full_name: true,
            email: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    // Normalize BigInt fields
    const normalized = attachments.map((attachment: any) => ({
      ...attachment,
      id: Number(attachment.id),
      task_id: Number(attachment.task_id),
      uploaded_by_id: Number(attachment.uploaded_by_id),
      file_size: Number(attachment.file_size),
      uploaded_by: {
        ...attachment.users,
        id: Number(attachment.users.id)
      }
    }));

    return NextResponse.json({
      success: true,
      data: normalized
    });
  } catch (error: any) {
    console.error('Get Attachments Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch attachments', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/tasks/[id]/attachments - Upload file
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const taskId = BigInt(id);

    // Check if task exists and user has access
    const task = await prisma.tasks.findUnique({
      where: { id: taskId },
      select: { 
        id: true, 
        task_number: true,
        title: true,
        department: true 
      }
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    // Check access
    if (auth.role !== 'admin' && task.department !== auth.department) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file || !file.size) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Read file buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Detect and validate file type
    const fileTypeInfo = detectFileType(buffer);
    if (!fileTypeInfo) {
      return NextResponse.json(
        { success: false, error: 'Unsupported file type' },
        { status: 400 }
      );
    }

    // Generate safe filename
    const originalExt = path.extname(file.name) || fileTypeInfo.ext;
    const baseName = path.basename(file.name, originalExt).replace(/[^a-z0-9_-]/gi, '_');
    const hash = crypto.randomBytes(6).toString('hex');
    const timestamp = Date.now();
    const safeFilename = `${baseName}_${timestamp}_${hash}${originalExt}`;

    // Create directory structure: uploads/tasks/[task_number]/
    const taskDir = path.join(process.cwd(), 'uploads', 'tasks', task.task_number);
    await fs.mkdir(taskDir, { recursive: true });

    // Save file
    const filePath = path.join(taskDir, safeFilename);
    await fs.writeFile(filePath, buffer);

    // Generate URL path for file access
    const urlPath = `/api/files/tasks/${task.task_number}/${safeFilename}`;

    // Create attachment record
    const attachment = await prisma.task_attachments.create({
      data: {
        task_id: taskId,
        uploaded_by_id: BigInt(auth.id),
        file_name: file.name,
        file_path: urlPath,
        file_size: BigInt(file.size),
        file_type: fileTypeInfo.type
      },
      include: {
        users: {
          select: {
            id: true,
            Full_name: true,
            email: true
          }
        }
      }
    });

    // Log activity
    await prisma.task_activity_logs.create({
      data: {
        task_id: taskId,
        user_id: BigInt(auth.id),
        action: 'attachment_added',
        new_value: `Added attachment: ${file.name}`
      }
    });

    // Notify watchers
    const watchers = await prisma.task_watchers.findMany({
      where: { task_id: taskId }
    });

    for (const watcher of watchers) {
      if (Number(watcher.user_id) !== auth.id) {
        await fetch(`${req.nextUrl.origin}/api/notifications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employee_id: String(Number(watcher.user_id)),
            type: 'task_attachment',
            title: 'New Attachment Added',
            message: `${auth.email} added an attachment to task "${task.title}"`,
            link: `/pages/user/task-tracking/my-tasks?task_id=${id}`
          })
        }).catch(err => console.error('Notification error:', err));
      }
    }

    // Normalize response
    const normalized = {
      ...attachment,
      id: Number(attachment.id),
      task_id: Number(attachment.task_id),
      uploaded_by_id: Number(attachment.uploaded_by_id),
      file_size: Number(attachment.file_size),
      uploaded_by: {
        ...attachment.users,
        id: Number(attachment.users.id)
      }
    };

    return NextResponse.json({
      success: true,
      data: normalized,
      message: 'File uploaded successfully'
    }, { status: 201 });
  } catch (error: any) {
    console.error('Upload Attachment Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload file', details: error.message },
      { status: 500 }
    );
  }
}
