import { NextRequest, NextResponse } from 'next/server';

// Centralized error handler to avoid leaking sensitive details to clients
export function handleError(error: unknown, req: NextRequest | Request): NextResponse {
  const isProduction = process.env.NODE_ENV === 'production';

  // Best-effort path extraction for both NextRequest and standard Request
  const path = (req as any)?.nextUrl?.pathname || (() => {
    try {
      return new URL((req as Request).url).pathname;
    } catch {
      return undefined;
    }
  })();

  // Server-side logging only
  console.error('Application error:', {
    message: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString(),
    path
  });

  if (isProduction) {
    return NextResponse.json(
      { message: 'An error occurred. Please try again later.' },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      message: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    },
    { status: 500 }
  );
}
