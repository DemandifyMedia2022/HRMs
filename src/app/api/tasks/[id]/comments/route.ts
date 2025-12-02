import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';

// GET /api/tasks/[id]/comments - List comments with user details
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

    // Check access - users can only see comments for tasks in their department (unless admin)
    if (auth.role !== 'admin' && task.department !== auth.department) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Fetch comments
    const comments = await prisma.task_comments.findMany({
      where: { task_id: taskId },
      include: {
        users: {
          select: {
            id: true,
            Full_name: true,
            email: true,
            department: true
          }
        }
      },
      orderBy: {
        created_at: 'asc'
      }
    });

    // Normalize BigInt fields
    const normalized = comments.map((comment: any) => ({
      ...comment,
      id: Number(comment.id),
      task_id: Number(comment.task_id),
      user_id: Number(comment.user_id),
      mentioned_users: comment.mentioned_users ? JSON.parse(comment.mentioned_users) : [],
      user: {
        ...comment.users,
        id: Number(comment.users.id)
      }
    }));

    return NextResponse.json({
      success: true,
      data: normalized
    });
  } catch (error: any) {
    console.error('Get Comments Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch comments', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/tasks/[id]/comments - Add comment with mention support
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
    const { comment_text } = body;

    // Validation
    if (!comment_text || comment_text.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Comment text is required' },
        { status: 400 }
      );
    }

    // Check if task exists and user has access
    const task = await prisma.tasks.findUnique({
      where: { id: taskId },
      include: {
        users_tasks_created_by_idTousers: {
          select: { id: true }
        },
        users_tasks_assigned_to_idTousers: {
          select: { id: true }
        },
        task_watchers: {
          select: { user_id: true }
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

    // Parse @mentions from comment text
    // Supports formats: @username or @[user_id]
    const mentionRegex = /@\[(\d+)\]|@(\w+)/g;
    const mentions = [];
    let match;

    while ((match = mentionRegex.exec(comment_text)) !== null) {
      if (match[1]) {
        // @[user_id] format
        mentions.push(parseInt(match[1]));
      } else if (match[2]) {
        // @username format - need to look up user
        const user = await prisma.users.findFirst({
          where: {
            OR: [
              { Full_name: { contains: match[2] } },
              { email: { startsWith: match[2] } }
            ]
          },
          select: { id: true }
        });
        if (user) {
          mentions.push(Number(user.id));
        }
      }
    }

    // Remove duplicates
    const uniqueMentions = [...new Set(mentions)];

    // Create comment
    const comment = await prisma.task_comments.create({
      data: {
        task_id: taskId,
        user_id: BigInt(auth.id),
        comment_text: comment_text.trim(),
        mentioned_users: uniqueMentions.length > 0 ? JSON.stringify(uniqueMentions) : null
      },
      include: {
        users: {
          select: {
            id: true,
            Full_name: true,
            email: true,
            department: true
          }
        }
      }
    });

    // Log activity
    await prisma.task_activity_logs.create({
      data: {
        task_id: taskId,
        user_id: BigInt(auth.id),
        action: 'commented',
        new_value: `Added comment: ${comment_text.substring(0, 100)}${comment_text.length > 100 ? '...' : ''}`
      }
    });

    // Collect users to notify
    const notifyUserIds = new Set<number>();

    // Add task creator
    if (task.users_tasks_created_by_idTousers) {
      notifyUserIds.add(Number(task.users_tasks_created_by_idTousers.id));
    }

    // Add assignee
    if (task.users_tasks_assigned_to_idTousers) {
      notifyUserIds.add(Number(task.users_tasks_assigned_to_idTousers.id));
    }

    // Add watchers
    task.task_watchers.forEach(watcher => {
      notifyUserIds.add(Number(watcher.user_id));
    });

    // Add mentioned users
    uniqueMentions.forEach(userId => {
      notifyUserIds.add(userId);
    });

    // Remove the comment author from notifications
    notifyUserIds.delete(auth.id);

    // Send notifications
    for (const userId of notifyUserIds) {
      const isMentioned = uniqueMentions.includes(userId);
      await fetch(`${req.nextUrl.origin}/api/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: String(userId),
          type: isMentioned ? 'task_mention' : 'task_comment',
          title: isMentioned ? 'You were mentioned in a comment' : 'New Comment on Task',
          message: `${auth.email} commented on task "${task.title}"`,
          link: `/pages/user/task-tracking/my-tasks?task_id=${id}`
        })
      }).catch(err => console.error('Notification error:', err));
    }

    // Normalize response
    const normalized = {
      ...comment,
      id: Number(comment.id),
      task_id: Number(comment.task_id),
      user_id: Number(comment.user_id),
      mentioned_users: uniqueMentions,
      user: {
        ...comment.users,
        id: Number(comment.users.id)
      }
    };

    return NextResponse.json({
      success: true,
      data: normalized,
      message: 'Comment added successfully'
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create Comment Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create comment', details: error.message },
      { status: 500 }
    );
  }
}
