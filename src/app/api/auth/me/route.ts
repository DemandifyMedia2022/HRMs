import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("access_token")?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    const payload = verifyToken(token) as any;
    // fetch latest user info from DB (name/email/type/department)
    const user = await (prisma as any).users.findUnique({ where: { email: payload.email } });
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    return NextResponse.json({
      id: typeof user.id === "bigint" ? Number(user.id) : user.id,
      email: user.email,
      name: user.name,
      role: String((user as any).type || payload.role || "user").toLowerCase(),
      job_role: (user as any).job_role ?? null,
      department: (user as any).department ?? null,
    });
  } catch (e: any) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}
