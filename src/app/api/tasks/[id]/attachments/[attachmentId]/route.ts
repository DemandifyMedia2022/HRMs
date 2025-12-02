import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';
import { promises as fs } from 'fs';
import path from 'path';

// DELETE /api/tasks/[id]/attachments/[attachmentId] - Delete attachment
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; attachmentId: string } }
) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id, attachmentId } = params;
    const taskId = BigInt(id);
    const attachmentIdBigInt = BigInt(attachmentId);

    // Check if attachment exists
    const attachment = await prisma.task_attachments.findUnique({
      where: { id: attachmentIdBigInt },
      include: {
        tasks: {
          select: {
            id: true,
            title: true,
            department: true
          }
        }
      }
    });

    if (!attachment) {
      return NextResponse.json(
        { success: false, error: 'Attachment not found' },
        { status: 404 }
      );
    }

    // Verify attachment belongs to the task
    if (Number(attachment.task_id) !== Number(taskId)) {
      return NextResponse.json(
        { success: false, error: 'Attachment does not belong to this task' },
        { status: 400 }
      );
    }

    // Check if user can delete (uploader, admin, or HR)
    const canDelete = 
      Number(attachment.uploaded_by_id) === auth.id || 
      auth.role === 'admin' ||
      auth.role === 'hr';

    if (!canDelete) {
      return NextResponse.json(
        { success: false, error: 'You can only delete your own attachments' },
        { status: 403 }
      );
    }

    // Delete physical file
    try {
      // Extract file path from URL path
      // URL format: /api/files/tasks/[task_number]/[filename]
      const urlPath = attachment.file_path;
      const pathParts = urlPath.split('/');
      const taskNumber = pathParts[pathParts.length - 2];
      const filename = pathParts[pathParts.length - 1];
      
      const filePath = path.join(process.cwd(), 'uploads', 'tasks', taskNumber, filename);
      await fs.unlink(filePath);
    } catch (fileError) {
      console.error('Error deleting physical file:', fileError);
      // Continue with database deletion even if file deletion fails
    }

    // Delete attachment record
    await prisma.task_attachments.delete({
      where: { id: attachmentIdBigInt }
    });

    // Log activity
    await prisma.task_activity_logs.create({
      data: {
        task_id: taskId,
        user_id: BigInt(auth.id),
        action: 'attachment_deleted',
        new_value: `Deleted attachment: ${attachment.file_name}`
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Attachment deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete Attachment Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete attachment', details: error.message },
      { status: 500 }
    );
  }
}

// GET /api/tasks/[id]/attachments/[attachmentId]/download - Download file
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; attachmentId: string } }
) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id, attachmentId } = params;
    const taskId = BigInt(id);
    const attachmentIdBigInt = BigInt(attachmentId);

    // Check if attachment exists
    const attachment = await prisma.task_attachments.findUnique({
      where: { id: attachmentIdBigInt },
      include: {
        tasks: {
          select: {
            id: true,
            department: true
          }
        }
      }
    });

    if (!attachment) {
      return NextResponse.json(
        { success: false, error: 'Attachment not found' },
        { status: 404 }
      );
    }

    // Verify attachment belongs to the task
    if (Number(attachment.task_id) !== Number(taskId)) {
      return NextResponse.json(
        { success: false, error: 'Attachment does not belong to this task' },
        { status: 400 }
      );
    }

    // Check access
    if (auth.role !== 'admin' && attachment.tasks.department !== auth.department) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Redirect to the file API endpoint
    // The existing /api/files endpoint handles the actual file serving
    return NextResponse.redirect(new URL(attachment.file_path, req.url));
  } catch (error: any) {
    console.error('Download Attachment Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to download attachment', details: error.message },
      { status: 500 }
    );
  }
}
