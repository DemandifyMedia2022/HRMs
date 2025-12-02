import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';

// PATCH /api/tasks/[id]/status - Update task status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const taskId = BigInt(id);
    const body = await req.json();
    const { status, blocking_reason } = body;

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Status is required' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['todo', 'in_progress', 'review', 'done'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status. Must be: todo, in_progress, review, or done' },
        { status: 400 }
      );
    }

    // Check if task exists
    const task = await prisma.tasks.findUnique({
      where: { id: taskId },
      include: {
        users_tasks_assigned_to_idTousers: {
          select: {
            id: true,
            Full_name: true
          }
        },
        task_watchers: true,
      }
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    // Check access
    // Admins can always update. For others, allow if:
    // - Task is in their department, OR
    // - They are the creator, OR
    // - They are the assignee, OR
    // - They are a watcher.
    if (auth.role !== 'admin') {
      const sameDepartment = task.department === auth.department;
      const isCreator = Number(task.created_by_id) === auth.id;
      const isAssignee = task.assigned_to_id ? Number(task.assigned_to_id) === auth.id : false;
      const isWatcher = task.task_watchers?.some((w: any) => Number(w.user_id) === auth.id) ?? false;

      if (!sameDepartment && !isCreator && !isAssignee && !isWatcher) {
        return NextResponse.json(
          { success: false, error: 'Access denied' },
          { status: 403 }
        );
      }
    }

    // Validate status transitions (optional business logic)
    const oldStatus = task.status;
    
    // Update data
    const updateData: any = {
      status
    };

    // Set completed date if status is done
    if (status === 'done' && oldStatus !== 'done') {
      updateData.completed_date = new Date();
    }

    // Clear completed date if moving away from done
    if (status !== 'done' && oldStatus === 'done') {
      updateData.completed_date = null;
    }

    // Update task
    const updatedTask = await prisma.tasks.update({
      where: { id: taskId },
      data: updateData,
      include: {
        users_tasks_created_by_idTousers: {
          select: {
            id: true,
            Full_name: true,
            email: true
          }
        },
        users_tasks_assigned_to_idTousers: {
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
        action: 'status_changed',
        field_name: 'status',
        old_value: oldStatus,
        new_value: status
      }
    });

    // Send notifications to watchers
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
            type: 'task_status_change',
            title: 'Task Status Updated',
            message: `Task "${task.title}" status changed from ${oldStatus} to ${status}`,
            link: `/pages/user/task-tracking/my-tasks?task_id=${id}`
          })
        }).catch(err => console.error('Notification error:', err));
      }
    }

    // Normalize response
    const normalized = {
      ...updatedTask,
      id: Number(updatedTask.id),
      created_by_id: Number(updatedTask.created_by_id),
      assigned_to_id: updatedTask.assigned_to_id ? Number(updatedTask.assigned_to_id) : null,
      parent_task_id: updatedTask.parent_task_id ? Number(updatedTask.parent_task_id) : null,
      created_by: updatedTask.users_tasks_created_by_idTousers
        ? {
            ...updatedTask.users_tasks_created_by_idTousers,
            id: Number(updatedTask.users_tasks_created_by_idTousers.id)
          }
        : null,
      assigned_to: updatedTask.users_tasks_assigned_to_idTousers
        ? {
            ...updatedTask.users_tasks_assigned_to_idTousers,
            id: Number(updatedTask.users_tasks_assigned_to_idTousers.id)
          }
        : null,
      // Remove Prisma relation fields from response
      users_tasks_created_by_idTousers: undefined,
      users_tasks_assigned_to_idTousers: undefined
    };

    return NextResponse.json({
      success: true,
      data: normalized,
      message: 'Task status updated successfully'
    });
  } catch (error: any) {
    console.error('Update Task Status Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update task status', details: error.message },
      { status: 500 }
    );
  }
}
