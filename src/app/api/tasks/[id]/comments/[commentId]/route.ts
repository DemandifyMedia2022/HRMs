import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';

// PUT /api/tasks/[id]/comments/[commentId] - Edit own comment
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id, commentId } = params;
    const taskId = BigInt(id);
    const commentIdBigInt = BigInt(commentId);
    const body = await req.json();
    const { comment_text } = body;

    // Validation
    if (!comment_text || comment_text.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Comment text is required' },
        { status: 400 }
      );
    }

    // Check if comment exists
    const existingComment = await prisma.task_comments.findUnique({
      where: { id: commentIdBigInt },
      include: {
        tasks: {
          select: {
            id: true,
            title: true,
            department: true
          }
        }
      }
    });

    if (!existingComment) {
      return NextResponse.json(
        { success: false, error: 'Comment not found' },
        { status: 404 }
      );
    }

    // Verify comment belongs to the task
    if (Number(existingComment.task_id) !== Number(taskId)) {
      return NextResponse.json(
        { success: false, error: 'Comment does not belong to this task' },
        { status: 400 }
      );
    }

    // Check if user is the comment author
    if (Number(existingComment.user_id) !== auth.id) {
      return NextResponse.json(
        { success: false, error: 'You can only edit your own comments' },
        { status: 403 }
      );
    }

    // Parse @mentions from updated comment text
    const mentionRegex = /@\[(\d+)\]|@(\w+)/g;
    const mentions = [];
    let match;

    while ((match = mentionRegex.exec(comment_text)) !== null) {
      if (match[1]) {
        mentions.push(parseInt(match[1]));
      } else if (match[2]) {
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

    const uniqueMentions = [...new Set(mentions)];

    // Update comment
    const updatedComment = await prisma.task_comments.update({
      where: { id: commentIdBigInt },
      data: {
        comment_text: comment_text.trim(),
        mentioned_users: uniqueMentions.length > 0 ? JSON.stringify(uniqueMentions) : null,
        is_edited: true,
        updated_at: new Date()
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
        action: 'comment_edited',
        new_value: `Edited comment`
      }
    });

    // Notify newly mentioned users (who weren't mentioned before)
    const oldMentions = existingComment.mentioned_users 
      ? JSON.parse(existingComment.mentioned_users) 
      : [];
    const newMentions = uniqueMentions.filter(id => !oldMentions.includes(id));

    for (const userId of newMentions) {
      if (userId !== auth.id) {
        await fetch(`${req.nextUrl.origin}/api/notifications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employee_id: String(userId),
            type: 'task_mention',
            title: 'You were mentioned in a comment',
            message: `${auth.email} mentioned you in a comment on task "${existingComment.tasks.title}"`,
            link: `/pages/user/task-tracking/my-tasks?task_id=${id}`
          })
        }).catch(err => console.error('Notification error:', err));
      }
    }

    // Normalize response
    const normalized = {
      ...updatedComment,
      id: Number(updatedComment.id),
      task_id: Number(updatedComment.task_id),
      user_id: Number(updatedComment.user_id),
      mentioned_users: uniqueMentions,
      user: {
        ...updatedComment.users,
        id: Number(updatedComment.users.id)
      }
    };

    return NextResponse.json({
      success: true,
      data: normalized,
      message: 'Comment updated successfully'
    });
  } catch (error: any) {
    console.error('Update Comment Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update comment', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id]/comments/[commentId] - Delete own comment
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id, commentId } = params;
    const taskId = BigInt(id);
    const commentIdBigInt = BigInt(commentId);

    // Check if comment exists
    const comment = await prisma.task_comments.findUnique({
      where: { id: commentIdBigInt },
      include: {
        tasks: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    if (!comment) {
      return NextResponse.json(
        { success: false, error: 'Comment not found' },
        { status: 404 }
      );
    }

    // Verify comment belongs to the task
    if (Number(comment.task_id) !== Number(taskId)) {
      return NextResponse.json(
        { success: false, error: 'Comment does not belong to this task' },
        { status: 400 }
      );
    }

    // Check if user is the comment author or admin
    const canDelete = 
      Number(comment.user_id) === auth.id || 
      auth.role === 'admin';

    if (!canDelete) {
      return NextResponse.json(
        { success: false, error: 'You can only delete your own comments' },
        { status: 403 }
      );
    }

    // Delete comment
    await prisma.task_comments.delete({
      where: { id: commentIdBigInt }
    });

    // Log activity
    await prisma.task_activity_logs.create({
      data: {
        task_id: taskId,
        user_id: BigInt(auth.id),
        action: 'comment_deleted',
        new_value: `Deleted comment`
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete Comment Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete comment', details: error.message },
      { status: 500 }
    );
  }
}
