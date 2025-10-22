import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
 
const JWT_SECRET = process.env.JWT_SECRET || "";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";
 
export type JwtUser = {
  id: number;
  email: string;
  role: "admin" | "hr" | "user";
  department: "sales" | "marketing" | "quality" | "it" | "csm" | "operation" | "development" | "quality analyst" | "hr" | "administration" | null;
};
 
// Helper function to determine role based on department and name
export function determineRole(department: string | null, fullName: string): "admin" | "hr" | "user" {
  const deptLower = department ? String(department).toLowerCase() : null;
  const nameLower = fullName.toLowerCase();
 
  // Special case: Viresh Kumbhar always gets admin access
  if (nameLower === "viresh kumbhar") {
    return "admin";
  }
 
  // Check if department is HR
  if (deptLower === "hr") {
    return "hr";
  }
 
  // Check if department is Administration
  if (deptLower === "administration") {
    return "admin";
  }
 
  // All other departments (operation, sales, quality, development, it, csm, marketing, quality analyst) get user role
  return "user";
}
 
export function generateToken(user: JwtUser) {
  if (!JWT_SECRET) throw new Error("JWT_SECRET not configured");
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, department: user.department },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
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