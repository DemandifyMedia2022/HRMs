import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';

// GET /api/tasks/[id]/watchers - List watchers
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = params;
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

    // Fetch watchers
    const watchers = await prisma.task_watchers.findMany({
      where: { task_id: taskId },
      include: {
        users: {
          select: {
            id: true,
            Full_name: true,
            email: true,
            department: true,
            job_role: true
          }
        }
      },
      orderBy: {
        added_at: 'asc'
      }
    });

    // Normalize BigInt fields
    const normalized = watchers.map((watcher: any) => ({
      id: Number(watcher.id),
      task_id: Number(watcher.task_id),
      user_id: Number(watcher.user_id),
      added_at: watcher.added_at,
      user: {
        ...watcher.users,
        id: Number(watcher.users.id)
      }
    }));

    return NextResponse.json({
      success: true,
      data: normalized
    });
  } catch (error: any) {
    console.error('Get Watchers Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch watchers', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/tasks/[id]/watchers - Add watcher
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = params;
    const taskId = BigInt(id);
    const body = await req.json();
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json(
        { success: false, error: 'user_id is required' },
        { status: 400 }
      );
    }

    // Check if task exists and user has access
    const task = await prisma.tasks.findUnique({
      where: { id: taskId },
      select: { 
        id: true, 
        title: true,
        department: true,
        users_tasks_created_by_idTousers: {
          select: { id: true }
        },
        users_tasks_assigned_to_idTousers: {
          select: { id: true }
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
    if (auth.role !== 'admin' && task.department !== auth.department) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Validate user exists and is active
    const user = await prisma.users.findUnique({
      where: { id: BigInt(user_id) },
      select: {
        id: true,
        Full_name: true,
        email: true,
        status: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.status !== 1) {
      return NextResponse.json(
        { success: false, error: 'Cannot add inactive user as watcher' },
        { status: 400 }
      );
    }

    // Check if user is already a watcher
    const existing = await prisma.task_watchers.findFirst({
      where: {
        task_id: taskId,
        user_id: BigInt(user_id)
      }
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'User is already watching this task' },
        { status: 409 }
      );
    }

    // Add watcher
    const watcher = await prisma.task_watchers.create({
      data: {
        task_id: taskId,
        user_id: BigInt(user_id)
      },
      include: {
        users: {
          select: {
            id: true,
            Full_name: true,
            email: true,
            department: true,
            job_role: true
          }
        }
      }
    });

    // Log activity
    await prisma.task_activity_logs.create({
      data: {
        task_id: taskId,
        user_id: BigInt(auth.id),
        action: 'watcher_added',
        new_value: `Added watcher: ${user.Full_name || user.email}`
      }
    });

    // Send notification to the new watcher (if not adding themselves)
    if (user_id !== auth.id) {
      await fetch(`${req.nextUrl.origin}/api/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: String(user_id),
          type: 'task_watcher_added',
          title: 'Added as Task Watcher',
          message: `You have been added as a watcher to task "${task.title}"`,
          link: `/pages/user/task-tracking/my-tasks?task_id=${id}`
        })
      }).catch(err => console.error('Notification error:', err));
    }

    // Normalize response
    const normalized = {
      id: Number(watcher.id),
      task_id: Number(watcher.task_id),
      user_id: Number(watcher.user_id),
      added_at: watcher.added_at,
      user: {
        ...watcher.users,
        id: Number(watcher.users.id)
      }
    };

    return NextResponse.json({
      success: true,
      data: normalized,
      message: 'Watcher added successfully'
    }, { status: 201 });
  } catch (error: any) {
    console.error('Add Watcher Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add watcher', details: error.message },
      { status: 500 }
    );
  }
}
