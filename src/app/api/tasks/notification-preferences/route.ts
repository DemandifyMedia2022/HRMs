import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';

// GET /api/tasks/notification-preferences - Get user's notification preferences
export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    // Fetch or create default preferences
    let preferences = await prisma.task_notification_preferences.findUnique({
      where: { user_id: BigInt(auth.id) }
    });

    // If no preferences exist, create default ones
    if (!preferences) {
      preferences = await prisma.task_notification_preferences.create({
        data: {
          user_id: BigInt(auth.id),
          notify_on_assignment: true,
          notify_on_status_change: true,
          notify_on_comment: true,
          notify_on_mention: true,
          notify_on_due_date: true,
          digest_frequency: 'immediate'
        }
      });
    }

    // Normalize response
    const normalized = {
      ...preferences,
      id: Number(preferences.id),
      user_id: Number(preferences.user_id)
    };

    return NextResponse.json({
      success: true,
      data: normalized
    });
  } catch (error: any) {
    console.error('Get Notification Preferences Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notification preferences', details: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/tasks/notification-preferences - Update user's notification preferences
export async function PUT(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const {
      notify_on_assignment,
      notify_on_status_change,
      notify_on_comment,
      notify_on_mention,
      notify_on_due_date,
      digest_frequency
    } = body;

    // Build update data
    const updateData: any = {};

    if (notify_on_assignment !== undefined) {
      updateData.notify_on_assignment = Boolean(notify_on_assignment);
    }

    if (notify_on_status_change !== undefined) {
      updateData.notify_on_status_change = Boolean(notify_on_status_change);
    }

    if (notify_on_comment !== undefined) {
      updateData.notify_on_comment = Boolean(notify_on_comment);
    }

    if (notify_on_mention !== undefined) {
      updateData.notify_on_mention = Boolean(notify_on_mention);
    }

    if (notify_on_due_date !== undefined) {
      updateData.notify_on_due_date = Boolean(notify_on_due_date);
    }

    if (digest_frequency !== undefined) {
      const validFrequencies = ['immediate', 'hourly', 'daily'];
      if (!validFrequencies.includes(digest_frequency)) {
        return NextResponse.json(
          { success: false, error: 'Invalid digest_frequency. Must be: immediate, hourly, or daily' },
          { status: 400 }
        );
      }
      updateData.digest_frequency = digest_frequency;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Upsert preferences
    const preferences = await prisma.task_notification_preferences.upsert({
      where: { user_id: BigInt(auth.id) },
      update: updateData,
      create: {
        user_id: BigInt(auth.id),
        notify_on_assignment: updateData.notify_on_assignment ?? true,
        notify_on_status_change: updateData.notify_on_status_change ?? true,
        notify_on_comment: updateData.notify_on_comment ?? true,
        notify_on_mention: updateData.notify_on_mention ?? true,
        notify_on_due_date: updateData.notify_on_due_date ?? true,
        digest_frequency: updateData.digest_frequency ?? 'immediate'
      }
    });

    // Normalize response
    const normalized = {
      ...preferences,
      id: Number(preferences.id),
      user_id: Number(preferences.user_id)
    };

    return NextResponse.json({
      success: true,
      data: normalized,
      message: 'Notification preferences updated successfully'
    });
  } catch (error: any) {
    console.error('Update Notification Preferences Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update notification preferences', details: error.message },
      { status: 500 }
    );
  }
}
