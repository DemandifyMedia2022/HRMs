import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/notifications
 * Fetch notifications for the current user
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const employeeId = searchParams.get('employee_id');
        const unreadOnly = searchParams.get('unread_only') === 'true';

        if (!employeeId) {
            return NextResponse.json(
                { error: 'employee_id is required' },
                { status: 400 }
            );
        }

        const where: any = { employee_id: employeeId };
        if (unreadOnly) {
            where.is_read = false;
        }

        const notifications = await prisma.notification.findMany({
            where,
            orderBy: { created_at: 'desc' },
            take: 50
        });

        return NextResponse.json({
            success: true,
            notifications
        });
    } catch (error: any) {
        console.error('Get Notifications Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch notifications', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/notifications
 * Create a new notification
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { employee_id, type, title, message, link } = body;

        if (!employee_id || !type || !title || !message) {
            return NextResponse.json(
                { error: 'employee_id, type, title, and message are required' },
                { status: 400 }
            );
        }

        // Deduplication: Check if there's an unread notification of the same type for this user created in the last hour
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const existingNotification = await prisma.notification.findFirst({
            where: {
                employee_id,
                type,
                is_read: false,
                created_at: {
                    gte: oneHourAgo
                }
            }
        });

        if (existingNotification) {
            // If exists, update the timestamp or just return it without creating a new one
            // Updating timestamp to bring it to top might be nice, but simple return is safer against spam
            return NextResponse.json({
                success: true,
                notification: existingNotification,
                message: 'Duplicate notification suppressed'
            });
        }

        const notification = await prisma.notification.create({
            data: {
                employee_id,
                type,
                title,
                message,
                link: link || null,
                is_read: false
            }
        });

        return NextResponse.json({
            success: true,
            notification
        });
    } catch (error: any) {
        console.error('Create Notification Error:', error);
        return NextResponse.json(
            { error: 'Failed to create notification', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/notifications
 * Mark notifications as read
 */
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { notification_ids, employee_id, mark_all_read } = body;

        if (mark_all_read && employee_id) {
            // Mark all notifications as read for this employee
            await prisma.notification.updateMany({
                where: { employee_id },
                data: { is_read: true }
            });

            return NextResponse.json({
                success: true,
                message: 'All notifications marked as read'
            });
        }

        if (!notification_ids || !Array.isArray(notification_ids)) {
            return NextResponse.json(
                { error: 'notification_ids array is required' },
                { status: 400 }
            );
        }

        await prisma.notification.updateMany({
            where: {
                id: { in: notification_ids }
            },
            data: { is_read: true }
        });

        return NextResponse.json({
            success: true,
            message: 'Notifications marked as read'
        });
    } catch (error: any) {
        console.error('Update Notifications Error:', error);
        return NextResponse.json(
            { error: 'Failed to update notifications', details: error.message },
            { status: 500 }
        );
    }
}
