import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const cookies = request.cookies;
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');

    let token: string | null = null;
    if (cookies.has('access_token')) {
      token = cookies.get('access_token')?.value || null;
    }
    if (!token && authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }

    if (!token) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    try {
      verifyToken(token);
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
    }

    // Fetch all labour welfare fund slabs
    // For now, return mock data. You can replace this with actual database queries
    const slabs = [
      {
        id: '1',
        name: 'Slab for Pune(1-3000)',
        state: 'Maharashtra',
        branch: 'Pune',
        minApplicability: 1,
        maxApplicability: 3000,
        employeeContribution: {
          April: 0,
          May: 0,
          June: 6,
          July: 0,
          August: 0,
          September: 0,
          October: 0,
          November: 0,
          December: 6,
          January: 0,
          February: 0,
          March: 0
        },
        employerContribution: {
          April: 0,
          May: 0,
          June: 18,
          July: 0,
          August: 0,
          September: 0,
          October: 0,
          November: 0,
          December: 18,
          January: 0,
          February: 0,
          March: 0
        }
      },
      {
        id: '2',
        name: 'Slab for Pune(3001-999999999)',
        state: 'Maharashtra',
        branch: 'Pune',
        minApplicability: 3001,
        maxApplicability: 999999999,
        employeeContribution: {
          April: 0,
          May: 0,
          June: 12,
          July: 0,
          August: 0,
          September: 0,
          October: 0,
          November: 0,
          December: 12,
          January: 0,
          February: 0,
          March: 0
        },
        employerContribution: {
          April: 0,
          May: 0,
          June: 36,
          July: 0,
          August: 0,
          September: 0,
          October: 0,
          November: 0,
          December: 36,
          January: 0,
          February: 0,
          March: 0
        }
      }
    ];

    return NextResponse.json({
      success: true,
      data: slabs
    });
  } catch (error: any) {
    console.error('Error fetching labour welfare fund slabs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch labour welfare fund slabs', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookies = request.cookies;
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');

    let token: string | null = null;
    if (cookies.has('access_token')) {
      token = cookies.get('access_token')?.value || null;
    }
    if (!token && authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }

    if (!token) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    try {
      verifyToken(token);
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    if (
      !body.name ||
      !body.state ||
      !body.branch ||
      body.minApplicability === undefined ||
      body.maxApplicability === undefined
    ) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Save to database - implement your database logic here
    // For now, just return success
    console.log('Saving labour welfare fund slab:', body);

    return NextResponse.json({
      success: true,
      message: 'Labour welfare fund slab saved successfully',
      data: body
    });
  } catch (error: any) {
    console.error('Error saving labour welfare fund slab:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save labour welfare fund slab', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookies = request.cookies;
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');

    let token: string | null = null;
    if (cookies.has('access_token')) {
      token = cookies.get('access_token')?.value || null;
    }
    if (!token && authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }

    if (!token) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    try {
      verifyToken(token);
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.id || !body.name || !body.state || !body.branch) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Update in database - implement your database logic here
    console.log('Updating labour welfare fund slab:', body);

    return NextResponse.json({
      success: true,
      message: 'Labour welfare fund slab updated successfully',
      data: body
    });
  } catch (error: any) {
    console.error('Error updating labour welfare fund slab:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update labour welfare fund slab', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const cookies = request.cookies;
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');

    let token: string | null = null;
    if (cookies.has('access_token')) {
      token = cookies.get('access_token')?.value || null;
    }
    if (!token && authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }

    if (!token) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    try {
      verifyToken(token);
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing slab ID' }, { status: 400 });
    }

    // Delete from database - implement your database logic here
    console.log('Deleting labour welfare fund slab:', id);

    return NextResponse.json({
      success: true,
      message: 'Labour welfare fund slab deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting labour welfare fund slab:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete labour welfare fund slab', details: error.message },
      { status: 500 }
    );
  }
}
