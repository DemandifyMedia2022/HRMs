import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';

// DELETE /api/tasks/[id]/labels/[labelId] - Remove a label from task
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; labelId: string } }
) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id, labelId } = params;
    const taskId = BigInt(id);
    const labelIdBigInt = BigInt(labelId);

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

    // Check if label is assigned to task
    const mapping = await prisma.task_label_mapping.findFirst({
      where: {
        task_id: taskId,
        label_id: labelIdBigInt
      },
      include: {
        task_labels: {
          select: { name: true }
        }
      }
    });

    if (!mapping) {
      return NextResponse.json(
        { success: false, error: 'Label is not assigned to this task' },
        { status: 404 }
      );
    }

    // Remove label
    await prisma.task_label_mapping.delete({
      where: {
        id: mapping.id
      }
    });

    // Log activity
    await prisma.task_activity_logs.create({
      data: {
        task_id: taskId,
        user_id: BigInt(auth.id),
        action: 'label_removed',
        new_value: `Removed label: ${mapping.task_labels.name}`
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Label removed from task successfully'
    });
  } catch (error: any) {
    console.error('Remove Task Label Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove label from task', details: error.message },
      { status: 500 }
    );
  }
}
