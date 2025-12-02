import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';

// DELETE /api/tasks/[id]/watchers/[userId] - Remove watcher
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id, userId } = params;
    const taskId = BigInt(id);
    const userIdBigInt = BigInt(userId);

    // Check if task exists and user has access
    const task = await prisma.tasks.findUnique({
      where: { id: taskId },
      select: { 
        id: true,
        title: true,
        department: true,
        created_by_id: true,
        assigned_to_id: true
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

    // Check if watcher exists
    const watcher = await prisma.task_watchers.findFirst({
      where: {
        task_id: taskId,
        user_id: userIdBigInt
      },
      include: {
        users: {
          select: {
            Full_name: true,
            email: true
          }
        }
      }
    });

    if (!watcher) {
      return NextResponse.json(
        { success: false, error: 'User is not watching this task' },
        { status: 404 }
      );
    }

    // Prevent removing creator or assignee as watchers (they should always watch)
    const isCreator = Number(task.created_by_id) === Number(userId);
    const isAssignee = task.assigned_to_id && Number(task.assigned_to_id) === Number(userId);

    if (isCreator || isAssignee) {
      return NextResponse.json(
        { success: false, error: 'Cannot remove task creator or assignee as watcher' },
        { status: 400 }
      );
    }

    // Check permissions - users can remove themselves, or admin/creator can remove others
    const canRemove = 
      Number(userId) === auth.id || // User removing themselves
      auth.role === 'admin' ||
      Number(task.created_by_id) === auth.id; // Task creator

    if (!canRemove) {
      return NextResponse.json(
        { success: false, error: 'You can only remove yourself as a watcher' },
        { status: 403 }
      );
    }

    // Remove watcher
    await prisma.task_watchers.delete({
      where: {
        id: watcher.id
      }
    });

    // Log activity
    await prisma.task_activity_logs.create({
      data: {
        task_id: taskId,
        user_id: BigInt(auth.id),
        action: 'watcher_removed',
        new_value: `Removed watcher: ${watcher.users.Full_name || watcher.users.email}`
      }
    });

    // Send notification to the removed watcher (if not removing themselves)
    if (Number(userId) !== auth.id) {
      await fetch(`${req.nextUrl.origin}/api/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: String(userId),
          type: 'task_watcher_removed',
          title: 'Removed as Task Watcher',
          message: `You have been removed as a watcher from task "${task.title}"`,
          link: `/pages/user/task-tracking/my-tasks?task_id=${id}`
        })
      }).catch(err => console.error('Notification error:', err));
    }

    return NextResponse.json({
      success: true,
      message: 'Watcher removed successfully'
    });
  } catch (error: any) {
    console.error('Remove Watcher Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove watcher', details: error.message },
      { status: 500 }
    );
  }
}
