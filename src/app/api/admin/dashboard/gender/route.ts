import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const rows = await (prisma as any).users.findMany({ select: { gender: true } });
    let male = 0, female = 0, other = 0;
    for (const r of rows) {
      const g = String((r as any).gender ?? "").trim().toLowerCase();
      if (g.startsWith("m")) male++;
      else if (g.startsWith("f")) female++;
      else other++;
    }
    return NextResponse.json({ male, female, other }, { headers: { "Cache-Control": "public, max-age=60" } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "error" }, { status: 500 });
  }
}
