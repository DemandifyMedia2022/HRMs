import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword, generateToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required" }, { status: 400 });
    }

    console.log('[auth/login] attempt for', email)
    const user = await (prisma as any).users.findUnique({ where: { email } });
    if (!user) {
      console.log('[auth/login] user not found for', email)
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    const dbHash: string = (user.password as string) || "";
    const normalizedHash = dbHash.startsWith("$2y$") ? "$2a$" + dbHash.slice(4) : dbHash;
    console.log('[auth/login] password hash present:', Boolean(dbHash))
    const valid = comparePassword(password, normalizedHash);
    console.log('[auth/login] password valid?:', valid)
    if (!valid) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    const roleRaw = (user as any).type ?? "user";
    const role = String(roleRaw).toLowerCase();
    const dept = (user as any).department ?? null;
    const idNum = typeof user.id === "bigint" ? Number(user.id) : (user.id as number);

    const token = generateToken({
      id: idNum,
      email: user.email,
      role: role as any,
      department: dept,
    });

    const redirectPath = role === 'admin' ? '/pages/admin' : role === 'hr' ? '/pages/hr' : '/pages/user';
    const responseBody = {
      id: idNum,
      email: user.email,
      role,
      department: dept,
      name: user.name,
      redirect: redirectPath,
    }

    const res = NextResponse.json(responseBody)
    // Also set the header for convenience
    res.headers.set('x-redirect-path', redirectPath)

    const isProd = process.env.NODE_ENV === "production";
    res.cookies.set("access_token", token, {
      httpOnly: true,
      sameSite: "strict",
      secure: isProd,
      path: "/",
      maxAge: 60 * 60, // 1 hour
    });
    return res;
  } catch (e: any) {
    return NextResponse.json({ message: "Login error", details: e.message }, { status: 500 });
  }
}
