import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '30d';

if (!JWT_SECRET || JWT_SECRET.trim() === '') {
  throw new Error('CRITICAL: JWT_SECRET environment variable is required. Application cannot start without it.');
}

if (!JWT_REFRESH_SECRET || JWT_REFRESH_SECRET.trim() === '') {
  throw new Error('CRITICAL: JWT_REFRESH_SECRET environment variable is required. Application cannot start without it.');
}

export type JwtUser = {
  id: number;
  email: string;
  role: 'admin' | 'hr' | 'user';
  department:
    | 'sales'
    | 'marketing'
    | 'quality'
    | 'it'
    | 'csm'
    | 'operation'
    | 'development'
    | 'hr'
    | 'administration'
    | null;
};

// Helper to normalize DB `type` column to one of allowed roles
export function mapTypeToRole(type: string | null | undefined): 'admin' | 'hr' | 'user' {
  const t = (type || 'user').toLowerCase().trim();
  if (t.includes('admin')) return 'admin';
  if (t === 'hr' || t.includes('human resource') || t.includes('human-resource')) return 'hr';
  return 'user';
}

export function generateToken(user: JwtUser) {
  if (!JWT_SECRET || JWT_SECRET.trim() === '') throw new Error('JWT_SECRET not configured');
  return jwt.sign({ id: user.id, email: user.email, role: user.role, department: user.department }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  } as jwt.SignOptions);
}

export function verifyToken(token: string) {
  if (!JWT_SECRET || JWT_SECRET.trim() === '') throw new Error('JWT_SECRET not configured');
  return jwt.verify(token, JWT_SECRET) as JwtUser;
}

export function generateRefreshToken(payload: { id: number }) {
  if (!JWT_REFRESH_SECRET || JWT_REFRESH_SECRET.trim() === '') throw new Error('JWT_REFRESH_SECRET not configured');
  return jwt.sign({ id: payload.id }, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN
  } as jwt.SignOptions);
}

export function verifyRefreshToken(token: string): { id: number } {
  if (!JWT_REFRESH_SECRET || JWT_REFRESH_SECRET.trim() === '') throw new Error('JWT_REFRESH_SECRET not configured');
  return jwt.verify(token, JWT_REFRESH_SECRET) as { id: number };
}

export function hashPassword(password: string) {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(plain: string, hash: string) {
  return bcrypt.compareSync(plain, hash);
}
