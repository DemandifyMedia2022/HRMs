import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';

// GET /api/tasks/[id]/labels - Get task labels
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

    // Fetch task labels
    const labelMappings = await prisma.task_label_mapping.findMany({
      where: { task_id: taskId },
      include: {
        task_labels: true
      }
    });

    // Normalize response
    const labels = labelMappings.map((mapping: any) => ({
      ...mapping.task_labels,
      id: Number(mapping.task_labels.id)
    }));

    return NextResponse.json({
      success: true,
      data: labels
    });
  } catch (error: any) {
    console.error('Get Task Labels Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch task labels', details: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/tasks/[id]/labels - Update task labels (replace all)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = params;
    const taskId = BigInt(id);
    const body = await req.json();
    const { label_ids = [] } = body;

    // Validate label_ids is an array
    if (!Array.isArray(label_ids)) {
      return NextResponse.json(
        { success: false, error: 'label_ids must be an array' },
        { status: 400 }
      );
    }

    // Check if task exists and user has access
    const task = await prisma.tasks.findUnique({
      where: { id: taskId },
      select: { 
        id: true, 
        title: true,
        department: true 
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

    // Validate all label IDs exist
    if (label_ids.length > 0) {
      const labels = await prisma.task_labels.findMany({
        where: {
          id: { in: label_ids.map((id: number) => BigInt(id)) }
        }
      });

      if (labels.length !== label_ids.length) {
        return NextResponse.json(
          { success: false, error: 'One or more label IDs are invalid' },
          { status: 400 }
        );
      }
    }

    // Get current labels for activity log
    const currentMappings = await prisma.task_label_mapping.findMany({
      where: { task_id: taskId },
      include: {
        task_labels: {
          select: { name: true }
        }
      }
    });

    const oldLabels = currentMappings.map(m => m.task_labels.name).join(', ');

    // Delete existing label mappings
    await prisma.task_label_mapping.deleteMany({
      where: { task_id: taskId }
    });

    // Create new label mappings
    if (label_ids.length > 0) {
      await prisma.task_label_mapping.createMany({
        data: label_ids.map((labelId: number) => ({
          task_id: taskId,
          label_id: BigInt(labelId)
        }))
      });
    }

    // Get new labels for activity log
    const newMappings = await prisma.task_label_mapping.findMany({
      where: { task_id: taskId },
      include: {
        task_labels: {
          select: { name: true }
        }
      }
    });

    const newLabels = newMappings.map(m => m.task_labels.name).join(', ');

    // Log activity
    await prisma.task_activity_logs.create({
      data: {
        task_id: taskId,
        user_id: BigInt(auth.id),
        action: 'labels_updated',
        field_name: 'labels',
        old_value: oldLabels || 'None',
        new_value: newLabels || 'None'
      }
    });

    // Fetch updated labels
    const updatedMappings = await prisma.task_label_mapping.findMany({
      where: { task_id: taskId },
      include: {
        task_labels: true
      }
    });

    // Normalize response
    const labels = updatedMappings.map((mapping: any) => ({
      ...mapping.task_labels,
      id: Number(mapping.task_labels.id)
    }));

    return NextResponse.json({
      success: true,
      data: labels,
      message: 'Task labels updated successfully'
    });
  } catch (error: any) {
    console.error('Update Task Labels Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update task labels', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/tasks/[id]/labels - Add a label to task
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
    const { label_id } = body;

    if (!label_id) {
      return NextResponse.json(
        { success: false, error: 'label_id is required' },
        { status: 400 }
      );
    }

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

    // Validate label exists
    const label = await prisma.task_labels.findUnique({
      where: { id: BigInt(label_id) }
    });

    if (!label) {
      return NextResponse.json(
        { success: false, error: 'Label not found' },
        { status: 404 }
      );
    }

    // Check if label is already assigned
    const existing = await prisma.task_label_mapping.findFirst({
      where: {
        task_id: taskId,
        label_id: BigInt(label_id)
      }
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Label is already assigned to this task' },
        { status: 409 }
      );
    }

    // Add label
    await prisma.task_label_mapping.create({
      data: {
        task_id: taskId,
        label_id: BigInt(label_id)
      }
    });

    // Log activity
    await prisma.task_activity_logs.create({
      data: {
        task_id: taskId,
        user_id: BigInt(auth.id),
        action: 'label_added',
        new_value: `Added label: ${label.name}`
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Label added to task successfully'
    });
  } catch (error: any) {
    console.error('Add Task Label Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add label to task', details: error.message },
      { status: 500 }
    );
  }
}
