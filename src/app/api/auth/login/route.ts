import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword, generateToken, determineRole } from "@/lib/auth";
 
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required" }, { status: 400 });
    }
 
    const user = await (prisma as any).users.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }
    const dbHash: string = user.password || "";
    const normalizedHash = dbHash.startsWith("$2y$") ? "$2a$" + dbHash.slice(4) : dbHash;
    const valid = comparePassword(password, normalizedHash);
    if (!valid) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }
 
    // Determine role based on department and name
    const dept = (user as any).department ?? null;
    const deptLower = dept ? String(dept).toLowerCase() : null;
    const fullName = user.name || "";
    const idNum = typeof user.id === "bigint" ? Number(user.id) : (user.id as number);
 
    const role = determineRole(deptLower, fullName);
 
    const token = generateToken({
      id: idNum,
      email: user.email,
      role,
      department: deptLower as any,
    });
 
    const res = NextResponse.json({
      id: idNum,
      email: user.email,
      role,
      department: deptLower,
      name: user.name,
      token, // Include token in response for debugging (remove in production)
    });
 
    const isProd = process.env.NODE_ENV === "production";
    res.cookies.set("access_token", token, {
      httpOnly: true,
      sameSite: "strict",
      secure: isProd,
      path: "/",
      maxAge: 60 * 60, // 1 hour
    });

    // Fire-and-forget: trigger ESSL attendance sync for realtime data on login
    try {
      const syncUrl = process.env.ESSL_SYNC_URL;
      if (syncUrl) {
        const emp = (user as any).emp_code ? String((user as any).emp_code) : undefined;
        const u = emp ? `${syncUrl}${syncUrl.includes("?") ? "&" : "?"}emp_code=${encodeURIComponent(emp)}` : syncUrl;
        const controller = new AbortController();
        const timeout = Number(process.env.ESSL_SYNC_TIMEOUT_MS || 5000);
        const to = setTimeout(() => controller.abort(), timeout);
        fetch(u, { method: "POST", signal: controller.signal }).catch(() => {} ).finally(() => clearTimeout(to));
      }
    } catch {}

    return res;
  } catch (e: any) {
    return NextResponse.json({ message: "Login error", details: e.message }, { status: 500 });
  }
}