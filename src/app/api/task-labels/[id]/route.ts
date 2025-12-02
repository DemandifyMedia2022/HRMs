import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';

// PUT /api/task-labels/[id] - Update label
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = params;
    const labelId = BigInt(id);
    const body = await req.json();
    const { name, color } = body;

    // Check if label exists
    const existingLabel = await prisma.task_labels.findUnique({
      where: { id: labelId }
    });

    if (!existingLabel) {
      return NextResponse.json(
        { success: false, error: 'Label not found' },
        { status: 404 }
      );
    }

    // Check permissions - only admin/hr can update department labels, users can update their own department labels
    if (existingLabel.department && existingLabel.department !== auth.department && auth.role !== 'admin' && auth.role !== 'hr') {
      return NextResponse.json(
        { success: false, error: 'You can only update labels in your department' },
        { status: 403 }
      );
    }

    // Build update data
    const updateData: any = {};

    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: 'Label name cannot be empty' },
          { status: 400 }
        );
      }

      if (name.length > 50) {
        return NextResponse.json(
          { success: false, error: 'Label name must be 50 characters or less' },
          { status: 400 }
        );
      }

      // Check for duplicate name in same department
      if (name.trim() !== existingLabel.name) {
        const duplicate = await prisma.task_labels.findFirst({
          where: {
            name: name.trim(),
            department: existingLabel.department,
            id: { not: labelId }
          }
        });

        if (duplicate) {
          return NextResponse.json(
            { success: false, error: 'A label with this name already exists in this department' },
            { status: 409 }
          );
        }
      }

      updateData.name = name.trim();
    }

    if (color !== undefined) {
      if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
        return NextResponse.json(
          { success: false, error: 'Valid color hex code is required (e.g., #FF5733)' },
          { status: 400 }
        );
      }
      updateData.color = color.toUpperCase();
    }

    // Update label
    const updatedLabel = await prisma.task_labels.update({
      where: { id: labelId },
      data: updateData
    });

    // Normalize response
    const normalized = {
      ...updatedLabel,
      id: Number(updatedLabel.id)
    };

    return NextResponse.json({
      success: true,
      data: normalized,
      message: 'Label updated successfully'
    });
  } catch (error: any) {
    console.error('Update Label Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update label', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/task-labels/[id] - Delete label (if not in use)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = params;
    const labelId = BigInt(id);

    // Check if label exists
    const label = await prisma.task_labels.findUnique({
      where: { id: labelId },
      include: {
        task_label_mapping: {
          take: 1
        }
      }
    });

    if (!label) {
      return NextResponse.json(
        { success: false, error: 'Label not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (label.department && label.department !== auth.department && auth.role !== 'admin' && auth.role !== 'hr') {
      return NextResponse.json(
        { success: false, error: 'You can only delete labels in your department' },
        { status: 403 }
      );
    }

    // Check if label is in use
    if (label.task_label_mapping.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete label that is currently in use by tasks' },
        { status: 409 }
      );
    }

    // Delete label
    await prisma.task_labels.delete({
      where: { id: labelId }
    });

    return NextResponse.json({
      success: true,
      message: 'Label deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete Label Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete label', details: error.message },
      { status: 500 }
    );
  }
}
