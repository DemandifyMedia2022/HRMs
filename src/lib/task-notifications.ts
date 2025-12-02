/**
 * Task Notification Helper Functions
 * Centralized notification logic for task-related events
 */

interface NotificationPayload {
  employee_id: string;
  type: string;
  title: string;
  message: string;
  link: string;
}

/**
 * Send a notification via the existing notification API
 */
async function sendNotification(origin: string, payload: NotificationPayload): Promise<void> {
  try {
    await fetch(`${origin}/api/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
}

/**
 * Notify user about task assignment
 */
export async function notifyTaskAssignment(
  origin: string,
  taskId: number,
  taskTitle: string,
  assigneeId: number,
  assignorEmail: string
): Promise<void> {
  await sendNotification(origin, {
    employee_id: String(assigneeId),
    type: 'task_assignment',
    title: 'New Task Assigned',
    message: `${assignorEmail} assigned you to task: ${taskTitle}`,
    link: `/pages/user/task-tracking/my-tasks?task_id=${taskId}`
  });
}

/**
 * Notify user about task reassignment (for previous assignee)
 */
export async function notifyTaskReassignment(
  origin: string,
  taskId: number,
  taskTitle: string,
  previousAssigneeId: number,
  newAssigneeName: string
): Promise<void> {
  await sendNotification(origin, {
    employee_id: String(previousAssigneeId),
    type: 'task_reassignment',
    title: 'Task Reassigned',
    message: `Task "${taskTitle}" has been reassigned to ${newAssigneeName}`,
    link: `/pages/user/task-tracking/my-tasks?task_id=${taskId}`
  });
}

/**
 * Notify watchers about task status change
 */
export async function notifyTaskStatusChange(
  origin: string,
  taskId: number,
  taskTitle: string,
  oldStatus: string,
  newStatus: string,
  watcherIds: number[],
  excludeUserId?: number
): Promise<void> {
  const notifications = watcherIds
    .filter(id => id !== excludeUserId)
    .map(watcherId => 
      sendNotification(origin, {
        employee_id: String(watcherId),
        type: 'task_status_change',
        title: 'Task Status Updated',
        message: `Task "${taskTitle}" status changed from ${oldStatus} to ${newStatus}`,
        link: `/pages/user/task-tracking/my-tasks?task_id=${taskId}`
      })
    );

  await Promise.all(notifications);
}

/**
 * Notify watchers about new comment
 */
export async function notifyTaskComment(
  origin: string,
  taskId: number,
  taskTitle: string,
  commenterEmail: string,
  watcherIds: number[],
  mentionedUserIds: number[],
  excludeUserId?: number
): Promise<void> {
  const allUserIds = new Set([...watcherIds, ...mentionedUserIds]);
  if (excludeUserId) {
    allUserIds.delete(excludeUserId);
  }

  const notifications = Array.from(allUserIds).map(userId => {
    const isMentioned = mentionedUserIds.includes(userId);
    return sendNotification(origin, {
      employee_id: String(userId),
      type: isMentioned ? 'task_mention' : 'task_comment',
      title: isMentioned ? 'You were mentioned in a comment' : 'New Comment on Task',
      message: `${commenterEmail} ${isMentioned ? 'mentioned you in a' : 'added a'} comment on task "${taskTitle}"`,
      link: `/pages/user/task-tracking/my-tasks?task_id=${taskId}`
    });
  });

  await Promise.all(notifications);
}

/**
 * Notify user about tasks due soon (within 24 hours)
 */
export async function notifyTaskDueSoon(
  origin: string,
  taskId: number,
  taskTitle: string,
  assigneeId: number,
  dueDate: Date
): Promise<void> {
  const hoursUntilDue = Math.round((dueDate.getTime() - Date.now()) / (1000 * 60 * 60));
  
  await sendNotification(origin, {
    employee_id: String(assigneeId),
    type: 'task_due_soon',
    title: 'Task Due Soon',
    message: `Task "${taskTitle}" is due in ${hoursUntilDue} hours`,
    link: `/pages/user/task-tracking/my-tasks?task_id=${taskId}`
  });
}

/**
 * Notify user about overdue tasks
 */
export async function notifyTaskOverdue(
  origin: string,
  taskId: number,
  taskTitle: string,
  assigneeId: number,
  dueDate: Date
): Promise<void> {
  const daysOverdue = Math.floor((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
  
  await sendNotification(origin, {
    employee_id: String(assigneeId),
    type: 'task_overdue',
    title: 'Task Overdue',
    message: `Task "${taskTitle}" is ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue`,
    link: `/pages/user/task-tracking/my-tasks?task_id=${taskId}`
  });
}

/**
 * Notify watchers about new attachment
 */
export async function notifyTaskAttachment(
  origin: string,
  taskId: number,
  taskTitle: string,
  uploaderEmail: string,
  watcherIds: number[],
  excludeUserId?: number
): Promise<void> {
  const notifications = watcherIds
    .filter(id => id !== excludeUserId)
    .map(watcherId => 
      sendNotification(origin, {
        employee_id: String(watcherId),
        type: 'task_attachment',
        title: 'New Attachment Added',
        message: `${uploaderEmail} added an attachment to task "${taskTitle}"`,
        link: `/pages/user/task-tracking/my-tasks?task_id=${taskId}`
      })
    );

  await Promise.all(notifications);
}

/**
 * Notify user about being added as watcher
 */
export async function notifyWatcherAdded(
  origin: string,
  taskId: number,
  taskTitle: string,
  watcherId: number
): Promise<void> {
  await sendNotification(origin, {
    employee_id: String(watcherId),
    type: 'task_watcher_added',
    title: 'Added as Task Watcher',
    message: `You have been added as a watcher to task "${taskTitle}"`,
    link: `/pages/user/task-tracking/my-tasks?task_id=${taskId}`
  });
}

/**
 * Notify user about being removed as watcher
 */
export async function notifyWatcherRemoved(
  origin: string,
  taskId: number,
  taskTitle: string,
  watcherId: number
): Promise<void> {
  await sendNotification(origin, {
    employee_id: String(watcherId),
    type: 'task_watcher_removed',
    title: 'Removed as Task Watcher',
    message: `You have been removed as a watcher from task "${taskTitle}"`,
    link: `/pages/user/task-tracking/my-tasks?task_id=${taskId}`
  });
}
