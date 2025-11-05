import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

/**
 * POST /api/auth/validate
 * Validates a JWT token without fetching user details from database
 * This is the first gate: "You say you're Sir Email-Password? Here's your entry token."
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

    // Validate token format (basic JWT structure check)
    if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) {
      return NextResponse.json(
        { success: false, message: 'Invalid token format' },
        { status: 401 }
      );
    }

    // Verify the token signature and expiration
    const payload = verifyToken(token);

    if (!payload || !payload.id || !payload.email) {
      return NextResponse.json(
        { success: false, message: 'Invalid token payload' },
        { status: 401 }
      );
    }

    // Token is valid - return success without revealing user details yet
    return NextResponse.json({
      success: true,
      message: 'Token validated successfully',
      userId: payload.id // Only return the user ID for the next step
    });
  } catch (error: any) {
    // Token verification failed (expired, invalid signature, etc.)
    return NextResponse.json(
      { success: false, message: 'Token validation failed', error: error.message },
      { status: 401 }
    );
  }
}
