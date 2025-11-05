import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, mapTypeToRole } from '@/lib/auth';
import { maybeEncryptForRequest } from '@/lib/crypto';

/**
 * POST /api/auth/user-details
 * Fetches user role and details from database using validated token
 * This is the second gate: "Show token. Let me check your official scrolls... oh you're a Knight (role admin)."
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Token is required' },
        { status: 400 }
      );
    }

    // Verify the token first
    let payload;
    try {
      payload = verifyToken(token);
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    if (!payload || !payload.email) {
      return NextResponse.json(
        { success: false, message: 'Invalid token payload' },
        { status: 401 }
      );
    }

    // Now fetch user details from database using the validated token
    const user = await (prisma as any).users.findUnique({
      where: { email: payload.email }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Determine role strictly from DB `type` column
    const dept = (user as any).department ?? null;
    const deptLower = dept ? String(dept).toLowerCase() : null;
    const idNum = typeof user.id === 'bigint' ? Number(user.id) : user.id;

    const role = mapTypeToRole((user as any).type);

    // Return minimal data plus email for the logged-in user
    return NextResponse.json(
      maybeEncryptForRequest(req.headers, { success: true, role, email: user.email })
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to fetch user details', error: error.message },
      { status: 500 }
    );
  }
}
