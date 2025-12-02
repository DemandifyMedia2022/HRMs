import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Background job endpoint to send notification digests
 * This should be called by a cron job or scheduler
 * - Hourly: Every hour for users with 'hourly' digest preference
 * - Daily: Once per day for users with 'daily' digest preference
 * 
 * Security: In production, this should be protected by an API key or internal network access
 */
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const frequency = searchParams.get('frequency') || 'hourly';

    if (!['hourly', 'daily'].includes(frequency)) {
      return NextResponse.json(
        { success: false, error: 'Invalid frequency. Must be: hourly or daily' },
        { status: 400 }
      );
    }

    // Get users with the specified digest frequency
    const users = await prisma.task_notification_preferences.findMany({
      where: {
        digest_frequency: frequency
      },
      include: {
        users: {
          select: {
            id: true,
            Full_name: true,
            email: true
          }
        }
      }
    });

    const origin = req.nextUrl.origin;
    const now = new Date();
    const cutoffTime = frequency === 'hourly' 
      ? new Date(now.getTime() - 60 * 60 * 1000) // Last hour
      : new Date(now.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours

    let digestsSent = 0;

    for (const userPref of users) {
      const userId = Number(userPref.user_id);

      // Get all tasks the user is watching
      const watchedTasks = await prisma.task_watchers.findMany({
        where: { user_id: BigInt(userId) },
        select: { task_id: true }
      });

      const taskIds = watchedTasks.map(w => w.task_id);

      if (taskIds.length === 0) continue;

      // Get recent activity on watched tasks
      const recentActivity = await prisma.task_activity_logs.findMany({
        where: {
          task_id: { in: taskIds },
          created_at: { gte: cutoffTime },
          user_id: { not: BigInt(userId) } // Exclude user's own actions
        },
        include: {
          tasks: {
            select: {
              id: true,
              task_number: true,
              title: true
            }
          },
          users: {
            select: {
              Full_name: true,
              email: true
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        },
        take: 50 // Limit to most recent 50 activities
      });

      // Get recent comments on watched tasks
      const recentComments = await prisma.task_comments.findMany({
        where: {
          task_id: { in: taskIds },
          created_at: { gte: cutoffTime },
          user_id: { not: BigInt(userId) } // Exclude user's own comments
        },
        include: {
          tasks: {
            select: {
              id: true,
              task_number: true,
              title: true
            }
          },
          users: {
            select: {
              Full_name: true,
              email: true
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        },
        take: 20 // Limit to most recent 20 comments
      });

      // Skip if no activity
      if (recentActivity.length === 0 && recentComments.length === 0) {
        continue;
      }

      // Group activities by task
      const taskActivities = new Map<number, any[]>();
      
      for (const activity of recentActivity) {
        const taskId = Number(activity.task_id);
        if (!taskActivities.has(taskId)) {
          taskActivities.set(taskId, []);
        }
        taskActivities.get(taskId)!.push({
          type: 'activity',
          action: activity.action,
          user: activity.users.Full_name || activity.users.email,
          field: activity.field_name,
          timestamp: activity.created_at
        });
      }

      for (const comment of recentComments) {
        const taskId = Number(comment.task_id);
        if (!taskActivities.has(taskId)) {
          taskActivities.set(taskId, []);
        }
        taskActivities.get(taskId)!.push({
          type: 'comment',
          user: comment.users.Full_name || comment.users.email,
          text: comment.comment_text.substring(0, 100),
          timestamp: comment.created_at
        });
      }

      // Build digest message
      const taskCount = taskActivities.size;
      const activityCount = recentActivity.length + recentComments.length;
      
      let message = `You have ${activityCount} update${activityCount !== 1 ? 's' : ''} on ${taskCount} task${taskCount !== 1 ? 's' : ''}:\n\n`;
      
      let itemCount = 0;
      for (const [taskId, activities] of taskActivities) {
        if (itemCount >= 5) break; // Limit to 5 tasks in digest
        
        const task = recentActivity.find(a => Number(a.task_id) === taskId)?.tasks 
                  || recentComments.find(c => Number(c.task_id) === taskId)?.tasks;
        
        if (task) {
          message += `• ${task.title} (${task.task_number}): ${activities.length} update${activities.length !== 1 ? 's' : ''}\n`;
          itemCount++;
        }
      }

      if (taskActivities.size > 5) {
        message += `\n...and ${taskActivities.size - 5} more tasks`;
      }

      // Send digest notification
      await fetch(`${origin}/api/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: String(userId),
          type: 'task_digest',
          title: `Task Digest (${frequency})`,
          message,
          link: '/pages/user/task-tracking/my-tasks'
        })
      }).catch(err => console.error('Digest notification error:', err));

      digestsSent++;
    }

    return NextResponse.json({
      success: true,
      message: `${frequency} digest notifications processed`,
      stats: {
        users_checked: users.length,
        digests_sent: digestsSent
      }
    });
  } catch (error: any) {
    console.error('Digest Notifications Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process digest notifications', details: error.message },
      { status: 500 }
    );
  }
}
