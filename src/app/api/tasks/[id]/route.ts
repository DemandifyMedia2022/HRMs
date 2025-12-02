import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';

// Helper function to convert BigInt to Number recursively
function convertBigIntToNumber(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'bigint') {
    return Number(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(convertBigIntToNumber);
  }
  
  if (typeof obj === 'object') {
    const converted: any = {};
    for (const key in obj) {
      converted[key] = convertBigIntToNumber(obj[key]);
    }
    return converted;
  }
  
  return obj;
}

// GET /api/tasks/[id] - Get single task with all details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const taskId = BigInt(id);

    const task = await prisma.tasks.findUnique({
      where: { id: taskId },
      include: {
        users_tasks_created_by_idTousers: {
          select: {
            id: true,
            Full_name: true,
            email: true,
            department: true
          }
        },
        users_tasks_assigned_to_idTousers: {
          select: {
            id: true,
            Full_name: true,
            email: true,
            department: true
          }
        },
        tasks: {
          select: {
            id: true,
            task_number: true,
            title: true,
            status: true
          }
        },
        other_tasks: {
          select: {
            id: true,
            task_number: true,
            title: true,
            status: true,
            priority: true,
            users_tasks_assigned_to_idTousers: {
              select: {
                id: true,
                Full_name: true
              }
            }
          }
        },
        task_label_mapping: {
          include: {
            task_labels: true
          }
        },
        task_watchers: {
          include: {
            users: {
              select: {
                id: true,
                Full_name: true,
                email: true
              }
            }
          }
        },
        task_comments: {
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
        },
        task_attachments: {
          include: {
            users: {
              select: {
                id: true,
                Full_name: true
              }
            }
          },
          orderBy: {
            created_at: 'desc'
          }
        },
        task_activity_logs: {
          include: {
            users: {
              select: {
                id: true,
                Full_name: true
              }
            }
          },
          orderBy: {
            created_at: 'desc'
          },
          take: 50
        },
        task_time_entries: {
          include: {
            users: {
              select: {
                id: true,
                Full_name: true
              }
            }
          },
          orderBy: {
            entry_date: 'desc'
          }
        },
        task_dependencies_task_dependencies_dependent_task_idTotasks: {
          include: {
            tasks_task_dependencies_prerequisite_task_idTotasks: {
              select: {
                id: true,
                task_number: true,
                title: true,
                status: true
              }
            }
          }
        },
        task_dependencies_task_dependencies_prerequisite_task_idTotasks: {
          include: {
            tasks_task_dependencies_dependent_task_idTotasks: {
              select: {
                id: true,
                task_number: true,
                title: true,
                status: true
              }
            }
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

    // Check access
    // Admins can always view. For others, allow if:
    // - Task is in their department, OR
    // - They are the creator, OR
    // - They are the assignee, OR
    // - They are a watcher.
    if (auth.role !== 'admin') {
      const isCreator = Number(task.created_by_id) === auth.id;
      const isAssignee = task.assigned_to_id ? Number(task.assigned_to_id) === auth.id : false;
      const isWatcher = task.task_watchers?.some((w: any) => Number(w.user_id) === auth.id) ?? false;

      const sameDepartment = task.department === auth.department;

      if (!sameDepartment && !isCreator && !isAssignee && !isWatcher) {
        return NextResponse.json(
          { success: false, error: 'Access denied' },
          { status: 403 }
        );
      }
    }

    // Normalize the task data structure
    const taskData = {
      id: task.id,
      task_number: task.task_number,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      due_date: task.due_date,
      start_date: task.start_date,
      completed_date: task.completed_date,
      estimated_hours: task.estimated_hours,
      actual_hours: task.actual_hours,
      department: task.department,
      created_by_id: task.created_by_id,
      assigned_to_id: task.assigned_to_id,
      parent_task_id: task.parent_task_id,
      blocking_reason: task.blocking_reason,
      is_archived: task.is_archived,
      archived_at: task.archived_at,
      created_at: task.created_at,
      updated_at: task.updated_at,
      created_by: task.users_tasks_created_by_idTousers,
      assigned_to: task.users_tasks_assigned_to_idTousers,
      parent_task: task.tasks,
      subtasks: task.other_tasks.map((st: any) => ({
        id: st.id,
        task_number: st.task_number,
        title: st.title,
        status: st.status,
        priority: st.priority,
        assigned_to: st.users_tasks_assigned_to_idTousers
      })),
      labels: task.task_label_mapping.map((l: any) => l.task_labels),
      watchers: task.task_watchers.map((w: any) => w.users),
      comments: task.task_comments.map((c: any) => ({
        id: c.id,
        task_id: c.task_id,
        user_id: c.user_id,
        comment_text: c.comment_text,
        mentioned_users: c.mentioned_users,
        is_edited: c.is_edited,
        created_at: c.created_at,
        updated_at: c.updated_at,
        user: c.users
      })),
      attachments: task.task_attachments.map((a: any) => ({
        id: a.id,
        task_id: a.task_id,
        uploaded_by_id: a.uploaded_by_id,
        file_name: a.file_name,
        file_path: a.file_path,
        file_size: a.file_size,
        file_type: a.file_type,
        created_at: a.created_at,
        uploaded_by: a.users
      })),
      activity_logs: task.task_activity_logs.map((log: any) => ({
        id: log.id,
        task_id: log.task_id,
        user_id: log.user_id,
        action: log.action,
        field_name: log.field_name,
        old_value: log.old_value,
        new_value: log.new_value,
        created_at: log.created_at,
        user: log.users
      })),
      time_entries: task.task_time_entries.map((te: any) => ({
        id: te.id,
        task_id: te.task_id,
        user_id: te.user_id,
        hours: te.hours,
        description: te.description,
        entry_date: te.entry_date,
        created_at: te.created_at,
        updated_at: te.updated_at,
        user: te.users
      })),
      dependencies_from: task.task_dependencies_task_dependencies_dependent_task_idTotasks.map((d: any) => ({
        id: d.id,
        dependent_task_id: d.dependent_task_id,
        prerequisite_task_id: d.prerequisite_task_id,
        created_at: d.created_at,
        prerequisite_task: d.tasks_task_dependencies_prerequisite_task_idTotasks
      })),
      dependencies_to: task.task_dependencies_task_dependencies_prerequisite_task_idTotasks.map((d: any) => ({
        id: d.id,
        dependent_task_id: d.dependent_task_id,
        prerequisite_task_id: d.prerequisite_task_id,
        created_at: d.created_at,
        dependent_task: d.tasks_task_dependencies_dependent_task_idTotasks
      }))
    };

    // Convert all BigInt fields to Number
    const normalized = convertBigIntToNumber(taskData);

    return NextResponse.json({
      success: true,
      data: normalized
    });
  } catch (error: any) {
    console.error('Get Task Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch task', details: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/tasks/[id] - Update task
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const taskId = BigInt(id);
    const body = await req.json();

    // Check if task exists
    const existingTask = await prisma.tasks.findUnique({
      where: { id: taskId }
    });

    if (!existingTask) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    // Check access
    if (auth.role !== 'admin' && existingTask.department !== auth.department) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const {
      title,
      description,
      priority,
      status,
      due_date,
      start_date,
      estimated_hours,
      blocking_reason
    } = body;

    // Build update data
    const updateData: any = {};
    const activityLogs: any[] = [];

    if (title !== undefined && title !== existingTask.title) {
      if (!title || title.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: 'Title cannot be empty' },
          { status: 400 }
        );
      }
      updateData.title = title.trim();
      activityLogs.push({
        action: 'updated',
        field_name: 'title',
        old_value: existingTask.title,
        new_value: title.trim()
      });
    }

    if (description !== undefined && description !== existingTask.description) {
      updateData.description = description?.trim() || null;
      activityLogs.push({
        action: 'updated',
        field_name: 'description',
        old_value: existingTask.description,
        new_value: description?.trim() || null
      });
    }

    if (priority !== undefined && priority !== existingTask.priority) {
      const validPriorities = ['low', 'medium', 'high', 'critical'];
      if (!validPriorities.includes(priority)) {
        return NextResponse.json(
          { success: false, error: 'Invalid priority' },
          { status: 400 }
        );
      }
      updateData.priority = priority;
      activityLogs.push({
        action: 'updated',
        field_name: 'priority',
        old_value: existingTask.priority,
        new_value: priority
      });
    }

    if (status !== undefined && status !== existingTask.status) {
      const validStatuses = ['todo', 'in_progress', 'review', 'done', 'blocked', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { success: false, error: 'Invalid status' },
          { status: 400 }
        );
      }

      // If status is blocked, require blocking_reason
      if (status === 'blocked' && !blocking_reason) {
        return NextResponse.json(
          { success: false, error: 'Blocking reason is required when status is blocked' },
          { status: 400 }
        );
      }

      updateData.status = status;
      if (status === 'done') {
        updateData.completed_date = new Date();
      }
      activityLogs.push({
        action: 'status_changed',
        field_name: 'status',
        old_value: existingTask.status,
        new_value: status
      });
    }

    if (blocking_reason !== undefined) {
      updateData.blocking_reason = blocking_reason;
    }

    if (due_date !== undefined) {
      updateData.due_date = due_date ? new Date(due_date) : null;
      activityLogs.push({
        action: 'updated',
        field_name: 'due_date',
        old_value: existingTask.due_date?.toISOString(),
        new_value: due_date
      });
    }

    if (start_date !== undefined) {
      updateData.start_date = start_date ? new Date(start_date) : null;
    }

    if (estimated_hours !== undefined) {
      updateData.estimated_hours = estimated_hours ? parseFloat(estimated_hours) : null;
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

    // Log activities
    if (activityLogs.length > 0) {
      await prisma.task_activity_logs.createMany({
        data: activityLogs.map(log => ({
          task_id: taskId,
          user_id: BigInt(auth.id),
          ...log
        }))
      });
    }

    // Send notification on status change
    if (status !== undefined && status !== existingTask.status) {
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
              type: 'task_status_change',
              title: 'Task Status Updated',
              message: `Task "${updatedTask.title}" status changed from ${existingTask.status} to ${status}`,
              link: `/pages/user/task-tracking/my-tasks?task_id=${id}`
            })
          });
        }
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
        : null
    };

    return NextResponse.json({
      success: true,
      data: normalized
    });
  } catch (error: any) {
    console.error('Update Task Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update task', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id] - Soft delete task
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = params;
    const taskId = BigInt(id);

    // Check if task exists
    const task = await prisma.tasks.findUnique({
      where: { id: taskId }
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    // Check access - only creator, assignee, or admin can delete
    const canDelete = 
      auth.role === 'admin' ||
      Number(task.created_by_id) === auth.id ||
      (task.assigned_to_id && Number(task.assigned_to_id) === auth.id);

    if (!canDelete) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Soft delete (archive)
    await prisma.tasks.update({
      where: { id: taskId },
      data: {
        is_archived: true,
        archived_at: new Date()
      }
    });

    // Log activity
    await prisma.task_activity_logs.create({
      data: {
        task_id: taskId,
        user_id: BigInt(auth.id),
        action: 'deleted',
        new_value: 'Task archived'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Task archived successfully'
    });
  } catch (error: any) {
    console.error('Delete Task Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete task', details: error.message },
      { status: 500 }
    );
  }
}
