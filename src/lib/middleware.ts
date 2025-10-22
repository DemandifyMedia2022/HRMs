import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './auth';

export type RequestUser = {
  id: number;
  email: string;
  role: 'admin' | 'hr' | 'user';
  department: 'sales' | 'marketing' | 'quality' | 'it' | 'csm' | 'operation' | null;
};

export function getUserFromCookies(req: NextRequest): RequestUser | null {
  try {
    const token = req.cookies.get('access_token')?.value;
    if (!token) return null;
    return verifyToken(token) as RequestUser;
  } catch {
    return null;
  }
}

export function requireAuth(req: NextRequest): RequestUser | NextResponse {
  const token = req.cookies.get('access_token')?.value;
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  try {
    const user = verifyToken(token) as RequestUser;
    return user;
  } catch {
    return NextResponse.json({ message: 'Invalid or expired token' }, { status: 403 });
  }
}

export function requireRoles(req: NextRequest, ...roles: RequestUser['role'][]): RequestUser | NextResponse {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  if (!roles.includes(auth.role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
  return auth;
}
