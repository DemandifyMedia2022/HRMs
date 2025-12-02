import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';

// PATCH /api/tasks/[id]/assign - Reassign task
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = params;
    const taskId = BigInt(id);
    const body = await req.json();
    const { assigned_to_id } = body;

    if (!assigned_to_id) {
      return NextResponse.json(
        { success: false, error: 'assigned_to_id is required' },
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
            Full_name: true,
            email: true
          }
        }
      }
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    // Check access - only creator, current assignee, managers, or admin can reassign
    const canReassign = 
      auth.role === 'admin' ||
      auth.role === 'hr' ||
      Number(task.created_by_id) === auth.id ||
      (task.assigned_to_id && Number(task.assigned_to_id) === auth.id);

    if (!canReassign) {
      return NextResponse.json(
        { success: false, error: 'Access denied. Only task creator, assignee, managers, or admin can reassign tasks' },
        { status: 403 }
      );
    }

    // Validate new assignee exists
    const newAssignee = await prisma.users.findUnique({
      where: { id: BigInt(assigned_to_id) },
      select: {
        id: true,
        Full_name: true,
        email: true,
        department: true,
        status: true
      }
    });

    if (!newAssignee) {
      return NextResponse.json(
        { success: false, error: 'Assignee not found' },
        { status: 404 }
      );
    }

    // Check if assignee is active
    if (newAssignee.status !== 1) {
      return NextResponse.json(
        { success: false, error: 'Cannot assign to inactive user' },
        { status: 400 }
      );
    }

    // Check cross-department assignment (require admin approval)
    if (task.department !== newAssignee.department && auth.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Cross-department assignment requires admin approval' },
        { status: 403 }
      );
    }

    const oldAssigneeId = task.assigned_to_id ? Number(task.assigned_to_id) : null;
    const oldAssigneeName = task.users_tasks_assigned_to_idTousers?.Full_name || 'Unassigned';

    // Update task
    const updatedTask = await prisma.tasks.update({
      where: { id: taskId },
      data: {
        assigned_to_id: BigInt(assigned_to_id)
      },
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

    // Add new assignee as watcher if not already
    await prisma.task_watchers.upsert({
      where: {
        task_id_user_id: {
          task_id: taskId,
          user_id: BigInt(assigned_to_id)
        }
      },
      create: {
        task_id: taskId,
        user_id: BigInt(assigned_to_id)
      },
      update: {}
    });

    // Log activity
    await prisma.task_activity_logs.create({
      data: {
        task_id: taskId,
        user_id: BigInt(auth.id),
        action: 'reassigned',
        field_name: 'assigned_to',
        old_value: oldAssigneeName,
        new_value: newAssignee.Full_name || ''
      }
    });

    // Send notification to new assignee
    if (assigned_to_id !== auth.id) {
      await fetch(`${req.nextUrl.origin}/api/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: String(assigned_to_id),
          type: 'task_assignment',
          title: 'Task Assigned to You',
          message: `You have been assigned to task: ${task.title}`,
          link: `/pages/user/task-tracking/my-tasks?task_id=${id}`
        })
      }).catch(err => console.error('Notification error:', err));
    }

    // Send notification to previous assignee if exists
    if (oldAssigneeId && oldAssigneeId !== auth.id && oldAssigneeId !== assigned_to_id) {
      await fetch(`${req.nextUrl.origin}/api/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: String(oldAssigneeId),
          type: 'task_reassignment',
          title: 'Task Reassigned',
          message: `Task "${task.title}" has been reassigned to ${newAssignee.Full_name}`,
          link: `/pages/user/task-tracking/my-tasks?task_id=${id}`
        })
      }).catch(err => console.error('Notification error:', err));
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
        : null
    };

    return NextResponse.json({
      success: true,
      data: normalized,
      message: 'Task reassigned successfully'
    });
  } catch (error: any) {
    console.error('Reassign Task Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reassign task', details: error.message },
      { status: 500 }
    );
  }
}
