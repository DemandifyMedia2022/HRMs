import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

export type JwtUser = {
  id: number;
  email: string;
  role: "admin" | "hr" | "user";
  department: "sales" | "marketing" | "quality" | "it" | "csm" | "operation" | null;
};

export function generateToken(user: JwtUser) {
  if (!JWT_SECRET) throw new Error("JWT_SECRET not configured");
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, department: user.department },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function verifyToken(token: string) {
  if (!JWT_SECRET) throw new Error("JWT_SECRET not configured");
  return jwt.verify(token, JWT_SECRET) as JwtUser;
}

export function hashPassword(password: string) {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(plain: string, hash: string) {
  return bcrypt.compareSync(plain, hash);
}
