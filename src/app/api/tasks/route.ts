import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';

// GET /api/tasks - List tasks with filtering
export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Filters
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const assigneeId = searchParams.get('assignee_id');
    const createdById = searchParams.get('created_by_id');
    const department = searchParams.get('department');
    const isArchived = searchParams.get('is_archived') === 'true';
    const dueDateFrom = searchParams.get('due_date_from');
    const dueDateTo = searchParams.get('due_date_to');
    const labelId = searchParams.get('label_id');
    const myTasks = searchParams.get('my_tasks') === 'true';

    // Build where clause
    const where: any = {
      is_archived: isArchived,
    };

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assigneeId) where.assigned_to_id = BigInt(assigneeId);
    if (createdById) where.created_by_id = BigInt(createdById);

    // When viewing general task lists, restrict by department for regular users.
    // Admins and HR can see all departments by default.
    // For "my tasks" views, do NOT restrict by department so users can
    // see tasks assigned to them across departments.
    if (!myTasks) {
      if (department) {
        where.department = department;
      } else if (auth.role !== 'admin' && auth.role !== 'hr' && auth.department) {
        where.department = auth.department;
      }
    }

    // My tasks filter
    if (myTasks) {
      where.OR = [
        { assigned_to_id: BigInt(auth.id) },
        { created_by_id: BigInt(auth.id) },
        {
          task_watchers: {
            some: { user_id: BigInt(auth.id) }
          }
        }
      ];
    }

    // Due date range
    if (dueDateFrom || dueDateTo) {
      where.due_date = {};
      if (dueDateFrom) where.due_date.gte = new Date(dueDateFrom);
      if (dueDateTo) where.due_date.lte = new Date(dueDateTo);
    }

    // Label filter
    if (labelId) {
      where.task_label_mapping = {
        some: { label_id: BigInt(labelId) }
      };
    }

    // Fetch tasks with relations
    const [tasks, total] = await Promise.all([
      (prisma as any).tasks.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { priority: 'desc' },
          { due_date: 'asc' },
          { created_at: 'desc' }
        ],
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
          task_label_mapping: {
            include: {
              task_labels: true
            }
          },
          _count: {
            select: {
              task_comments: true,
              task_attachments: true,
              other_tasks: true,
              task_watchers: true
            }
          }
        }
      }),
      (prisma as any).tasks.count({ where })
    ]);

    // Normalize BigInt fields
    const normalized = tasks.map((task: any) => ({
      ...task,
      id: Number(task.id),
      created_by_id: Number(task.created_by_id),
      assigned_to_id: task.assigned_to_id ? Number(task.assigned_to_id) : null,
      parent_task_id: task.parent_task_id ? Number(task.parent_task_id) : null,
      created_by: task.users_tasks_created_by_idTousers ? {
        ...task.users_tasks_created_by_idTousers,
        id: Number(task.users_tasks_created_by_idTousers.id)
      } : null,
      assigned_to: task.users_tasks_assigned_to_idTousers ? {
        ...task.users_tasks_assigned_to_idTousers,
        id: Number(task.users_tasks_assigned_to_idTousers.id)
      } : null,
      labels: task.task_label_mapping.map((l: any) => ({
        ...l.task_labels,
        id: Number(l.task_labels.id)
      })),
      _count: {
        comments: task._count.task_comments,
        attachments: task._count.task_attachments,
        subtasks: task._count.other_tasks,
        watchers: task._count.task_watchers
      },
      // Remove Prisma relation fields from response
      users_tasks_created_by_idTousers: undefined,
      users_tasks_assigned_to_idTousers: undefined,
      task_label_mapping: undefined
    }));

    return NextResponse.json({
      success: true,
      data: normalized,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Get Tasks Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tasks', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Create new task
export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const {
      title,
      description,
      priority = 'medium',
      status = 'todo',
      due_date,
      start_date,
      estimated_hours,
      department,
      assigned_to_id,
      parent_task_id,
      label_ids = [],
      watcher_ids = []
    } = body;

    // Validation
    if (!title || title.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }

    if (title.length > 255) {
      return NextResponse.json(
        { success: false, error: 'Title must be 255 characters or less' },
        { status: 400 }
      );
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high', 'critical'];
    if (!validPriorities.includes(priority)) {
      return NextResponse.json(
        { success: false, error: 'Invalid priority. Must be: low, medium, high, or critical' },
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

    // Validate assignee exists and fetch their emp_code for notifications
    let assigneeEmpCode: string | null = null;
    if (assigned_to_id) {
      const assignee = await (prisma as any).users.findUnique({
        where: { id: BigInt(assigned_to_id) },
        select: {
          id: true,
          emp_code: true
        }
      });
      if (!assignee) {
        return NextResponse.json(
          { success: false, error: 'Assignee not found' },
          { status: 404 }
        );
      }

      assigneeEmpCode = assignee.emp_code ? String(assignee.emp_code) : null;
    }

    // Generate task number
    const taskCount = await (prisma as any).tasks.count();
    const task_number = `TASK-${String(taskCount + 1).padStart(6, '0')}`;

    // Create task
    const task = await (prisma as any).tasks.create({
      data: {
        task_number,
        title: title.trim(),
        description: description?.trim() || null,
        priority,
        status,
        due_date: due_date ? new Date(due_date) : null,
        start_date: start_date ? new Date(start_date) : null,
        estimated_hours: estimated_hours ? parseFloat(estimated_hours) : null,
        department: department || auth.department,
        created_by_id: BigInt(auth.id),
        assigned_to_id: assigned_to_id ? BigInt(assigned_to_id) : null,
        parent_task_id: parent_task_id ? BigInt(parent_task_id) : null
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

    // Add labels if provided
    if (label_ids.length > 0) {
      await (prisma as any).task_label_mapping.createMany({
        data: label_ids.map((labelId: number) => ({
          task_id: task.id,
          label_id: BigInt(labelId)
        }))
      });
    }

    // Add watchers (creator and assignee are automatically watchers)
    const watcherSet = new Set([auth.id]);
    if (assigned_to_id) watcherSet.add(Number(assigned_to_id));
    watcher_ids.forEach((id: number) => watcherSet.add(id));

    await (prisma as any).task_watchers.createMany({
      data: Array.from(watcherSet).map(userId => ({
        task_id: task.id,
        user_id: BigInt(userId)
      }))
    });

    // Log activity
    await (prisma as any).task_activity_logs.create({
      data: {
        task_id: task.id,
        user_id: BigInt(auth.id),
        action: 'created',
        new_value: 'Task created'
      }
    });

    // Send notification to assignee if different from creator
    // Use emp_code as employee_id so it matches how the header fetches notifications
    if (assigned_to_id && assigned_to_id !== auth.id && assigneeEmpCode) {
      await fetch(`${req.nextUrl.origin}/api/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: assigneeEmpCode,
          type: 'task_assignment',
          title: 'New Task Assigned',
          message: `You have been assigned to task: ${title}`,
          link: `/pages/user/task-tracking/my-tasks?task_id=${Number(task.id)}`
        })
      });
    }

    // Normalize response
    const normalized = {
      ...task,
      id: Number(task.id),
      created_by_id: Number(task.created_by_id),
      assigned_to_id: task.assigned_to_id ? Number(task.assigned_to_id) : null,
      parent_task_id: task.parent_task_id ? Number(task.parent_task_id) : null,
      created_by: task.users_tasks_created_by_idTousers ? {
        ...task.users_tasks_created_by_idTousers,
        id: Number(task.users_tasks_created_by_idTousers.id)
      } : null,
      assigned_to: task.users_tasks_assigned_to_idTousers ? {
        ...task.users_tasks_assigned_to_idTousers,
        id: Number(task.users_tasks_assigned_to_idTousers.id)
      } : null,
      // Remove Prisma relation fields from response
      users_tasks_created_by_idTousers: undefined,
      users_tasks_assigned_to_idTousers: undefined
    };

    return NextResponse.json({
      success: true,
      data: normalized
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create Task Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create task', details: error.message },
      { status: 500 }
    );
  }
}
