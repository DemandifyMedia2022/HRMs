import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/middleware";

// PUT /api/users/:id - Update user (admin only)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireRoles(req, "admin");
  if (auth instanceof NextResponse) return auth;

  try {
    const { id: idStr } = await params;
    const id = Number(idStr);
    if (!Number.isFinite(id)) return NextResponse.json({ message: "Invalid id" }, { status: 400 });

    const body = await req.json();
    const data: any = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.role !== undefined) data.type = body.role; // map role -> type
    if (body.department !== undefined) data.department = body.department;

    const updated = await (prisma as any).users.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, type: true, department: true, createdAt: true, updatedAt: true },
    });
    const dto = {
      id: typeof updated.id === "bigint" ? Number(updated.id) : updated.id,
      name: updated.name,
      email: updated.email,
      role: String(updated.type || "user").toLowerCase(),
      department: updated.department,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
    return NextResponse.json(dto);
  } catch (e: any) {
    return NextResponse.json({ message: "Failed to update user", details: e.message }, { status: 500 });
  }
}

// DELETE /api/users/:id - Delete user (admin only)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireRoles(req, "admin");
  if (auth instanceof NextResponse) return auth;

  try {
    const { id: idStr } = await params;
    const id = Number(idStr);
    if (!Number.isFinite(id)) return NextResponse.json({ message: "Invalid id" }, { status: 400 });

    await (prisma as any).users.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted" });
  } catch (e: any) {
    return NextResponse.json({ message: "Failed to delete user", details: e.message }, { status: 500 });
  }
}