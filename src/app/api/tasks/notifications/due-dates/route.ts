import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notifyTaskDueSoon, notifyTaskOverdue } from '@/lib/task-notifications';

/**
 * Background job endpoint to check for tasks due soon or overdue
 * This should be called by a cron job or scheduler
 * 
 * Security: In production, this should be protected by an API key or internal network access
 */
export async function POST(req: NextRequest) {
  try {
    const now = new Date();
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find tasks due within 24 hours (not yet overdue, not completed)
    const tasksDueSoon = await prisma.tasks.findMany({
      where: {
        status: {
          notIn: ['done', 'cancelled']
        },
        due_date: {
          gte: now,
          lte: twentyFourHoursFromNow
        },
        assigned_to_id: {
          not: null
        }
      },
      select: {
        id: true,
        task_number: true,
        title: true,
        due_date: true,
        assigned_to_id: true
      }
    });

    // Find overdue tasks (not completed)
    const tasksOverdue = await prisma.tasks.findMany({
      where: {
        status: {
          notIn: ['done', 'cancelled']
        },
        due_date: {
          lt: now
        },
        assigned_to_id: {
          not: null
        }
      },
      select: {
        id: true,
        task_number: true,
        title: true,
        due_date: true,
        assigned_to_id: true
      }
    });

    const origin = req.nextUrl.origin;
    const notifications: Promise<void>[] = [];

    // Send due soon notifications
    for (const task of tasksDueSoon) {
      if (task.assigned_to_id && task.due_date) {
        // Check user's notification preferences
        const prefs = await prisma.task_notification_preferences.findUnique({
          where: { user_id: task.assigned_to_id }
        });

        // Only send if user has due date notifications enabled (default: true)
        if (!prefs || prefs.notify_on_due_date) {
          notifications.push(
            notifyTaskDueSoon(
              origin,
              Number(task.id),
              task.title,
              Number(task.assigned_to_id),
              task.due_date
            )
          );
        }
      }
    }

    // Send overdue notifications
    for (const task of tasksOverdue) {
      if (task.assigned_to_id && task.due_date) {
        // Check user's notification preferences
        const prefs = await prisma.task_notification_preferences.findUnique({
          where: { user_id: task.assigned_to_id }
        });

        // Only send if user has due date notifications enabled (default: true)
        if (!prefs || prefs.notify_on_due_date) {
          notifications.push(
            notifyTaskOverdue(
              origin,
              Number(task.id),
              task.title,
              Number(task.assigned_to_id),
              task.due_date
            )
          );
        }
      }
    }

    await Promise.all(notifications);

    return NextResponse.json({
      success: true,
      message: 'Due date notifications processed',
      stats: {
        due_soon: tasksDueSoon.length,
        overdue: tasksOverdue.length,
        notifications_sent: notifications.length
      }
    });
  } catch (error: any) {
    console.error('Due Date Notifications Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process due date notifications', details: error.message },
      { status: 500 }
    );
  }
}
