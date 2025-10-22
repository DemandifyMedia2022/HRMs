import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function norm(s: any) { return (s ?? "").toString().trim(); }

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const by = (url.searchParams.get("by") || "department").toLowerCase(); // department | branch
    const field = by === "branch" ? "branch" : "department";

    const rows = await (prisma as any).users.findMany({ select: { [field]: true } });
    const counts: Record<string, number> = {};
    for (const r of rows) {
      const key = norm((r as any)[field]) || "Not Defined";
      counts[key] = (counts[key] || 0) + 1;
    }
    const items = Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    return NextResponse.json({ by, items }, { headers: { "Cache-Control": "public, max-age=60" } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "error" }, { status: 500 });
  }
}
