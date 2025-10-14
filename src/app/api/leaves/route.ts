import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
 
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const leave_type = searchParams.get("leave_type") || undefined
    const month = searchParams.get("month") || undefined // expects YYYY-MM
    const user_name = searchParams.get("user_name") || undefined
    const Leaves_Status = searchParams.get("Leaves_Status") || undefined
    const page = Math.max(1, Number(searchParams.get("page") || 1))
    const pageSize = Math.max(1, Number(searchParams.get("pageSize") || 10))
 
    const where: any = {}
    if (leave_type) where.leave_type = leave_type
    if (user_name) where.added_by_user = user_name
    if (Leaves_Status) where.HRapproval = Leaves_Status
 
    if (month) {
      const [y, m] = month.split("-")
      const year = Number(y)
      const mon = Number(m) - 1
      if (!isNaN(year) && !isNaN(mon)) {
        const start = new Date(Date.UTC(year, mon, 1))
        const end = new Date(Date.UTC(year, mon + 1, 0, 23, 59, 59, 999))
        where.start_date = { gte: start, lte: end }
      }
    }
 
    const [total, data] = await Promise.all([
      prisma.leavedata.count({ where }),
      prisma.leavedata.findMany({
        where,
        orderBy: { start_date: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])
 
    return NextResponse.json({
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    })
  } catch (e: any) {
    const message = typeof e?.message === "string" ? e.message : "Failed to fetch leavedata"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
 
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const leaveType = body?.Leave_Type ?? body?.leave_type
    const startDate = body?.Leave_Start_Date ?? body?.start_date
    const endDate = body?.Leave_End_Date ?? body?.end_date
    const reason = body?.Reson ?? body?.reason
    const addedByUser = body?.added_by_user ?? body?.addedByUser ?? "unknown"
 
    if (!leaveType || !startDate || !endDate || !reason) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
 
    const created = await prisma.leavedata.create({
      data: {
        leave_type: String(leaveType),
        start_date: new Date(startDate),
        end_date: new Date(endDate),
        reason: String(reason),
        HRapproval: "pending",
        HRrejectReason: "pending",
        Managerapproval: "pending",
        ManagerRejecjetReason: "pending",
        leaveregdate: new Date(),
        added_by_user: String(addedByUser),
      },
    })
 
    return NextResponse.json({ id: created.l_id }, { status: 201 })
  } catch (e: any) {
    const message = typeof e?.message === "string" ? e.message : "Failed to create leave"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
 
export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const id = Number(body?.id)
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
 
    const data: any = {}
    if (body?.HRapproval) data.HRapproval = String(body.HRapproval)
    if (body?.HRrejectReason !== undefined) data.HRrejectReason = String(body.HRrejectReason)
    if (body?.Managerapproval) data.Managerapproval = String(body.Managerapproval)
    if (body?.ManagerRejecjetReason !== undefined) data.ManagerRejecjetReason = String(body.ManagerRejecjetReason)
 
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 })
    }
 
    await prisma.leavedata.update({
      where: { l_id: id },
      data,
    })
 
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    const message = typeof e?.message === "string" ? e.message : "Failed to update leave"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}