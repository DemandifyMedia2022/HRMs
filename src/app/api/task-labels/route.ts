import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';

// GET /api/task-labels - List all labels (filtered by department if applicable)
export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const department = searchParams.get('department');

    // Build where clause
    const where: any = {};

    // If user is not admin, filter by their department or global labels (null department)
    if (auth.role !== 'admin') {
      where.OR = [
        { department: auth.department },
        { department: null }
      ];
    } else if (department) {
      // Admin can filter by specific department
      where.department = department;
    }

    // Fetch labels
    const labels = await prisma.task_labels.findMany({
      where,
      orderBy: [
        { department: 'asc' },
        { name: 'asc' }
      ]
    });

    // Normalize BigInt fields
    const normalized = labels.map((label: any) => ({
      ...label,
      id: Number(label.id)
    }));

    return NextResponse.json({
      success: true,
      data: normalized
    });
  } catch (error: any) {
    console.error('Get Labels Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch labels', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/task-labels - Create new label
export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { name, color, department } = body;

    // Validation
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Label name is required' },
        { status: 400 }
      );
    }

    if (name.length > 50) {
      return NextResponse.json(
        { success: false, error: 'Label name must be 50 characters or less' },
        { status: 400 }
      );
    }

    if (!color || !/^#[0-9A-Fa-f]{6}$/.test(color)) {
      return NextResponse.json(
        { success: false, error: 'Valid color hex code is required (e.g., #FF5733)' },
        { status: 400 }
      );
    }

    // Determine department for the label
    let labelDepartment = null;
    if (department) {
      // If department is specified, only admin/hr can create department-specific labels
      if (auth.role !== 'admin' && auth.role !== 'hr') {
        return NextResponse.json(
          { success: false, error: 'Only admin or HR can create department-specific labels' },
          { status: 403 }
        );
      }
      labelDepartment = department;
    } else {
      // If no department specified, use user's department (or null for admin)
      labelDepartment = auth.role === 'admin' ? null : auth.department;
    }

    // Check for duplicate label name in the same department
    const existing = await prisma.task_labels.findFirst({
      where: {
        name: name.trim(),
        department: labelDepartment
      }
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'A label with this name already exists in this department' },
        { status: 409 }
      );
    }

    // Create label
    const label = await prisma.task_labels.create({
      data: {
        name: name.trim(),
        color: color.toUpperCase(),
        department: labelDepartment
      }
    });

    // Normalize response
    const normalized = {
      ...label,
      id: Number(label.id)
    };

    return NextResponse.json({
      success: true,
      data: normalized,
      message: 'Label created successfully'
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create Label Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create label', details: error.message },
      { status: 500 }
    );
  }
}
