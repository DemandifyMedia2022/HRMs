import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search") || undefined
    const page = Math.max(1, Number(searchParams.get("page") || 1))
    const pageSize = Math.max(1, Math.min(50, Number(searchParams.get("pageSize") || 10)))
    const archived = searchParams.get("archived") === "true"

    const where: any = {}
    if (search) {
      where.OR = [
        { Full_name: { contains: search } },
        { name: { contains: search } },
        { email: { contains: search } },
        { emp_code: { contains: search } },
      ]
    }

    const [total, rows] = await Promise.all([
      archived
        ? prisma.deleted_user_informations.count({ where } as any)
        : prisma.users.count({ where } as any),
      archived
        ? prisma.deleted_user_informations.findMany({
            where: where as any,
            orderBy: { Deleted_User_ID: "asc" },
            skip: (page - 1) * pageSize,
            take: pageSize,
            select: {
              Deleted_User_ID: true,
              name: true,
              full_name: true,
              email: true,
              emp_code: true,
              department: true,
              employment_status: true,
              company_name: true,
              date_of_resignation: true,
              expected_last_working_day: true,
              date_of_relieving: true,
              resignation_reason_employee: true,
              resignation_reason_approver: true,
              settelment_employee_other_status: true,
              employee_other_status_remarks: true,
            },
          })
        : prisma.users.findMany({
            where: where as any,
            orderBy: { id: "asc" },
            skip: (page - 1) * pageSize,
            take: pageSize,
            select: {
              id: true,
              name: true,
              Full_name: true,
              email: true,
              emp_code: true,
              department: true,
              employment_status: true,
              company_name: true,
            },
          }),
    ])

    const data = rows.map((u: any) =>
      archived
        ? {
            ...u,
            id: u.Deleted_User_ID,
            full_name: u.full_name ?? undefined,
          }
        : {
            ...u,
            id: typeof u.id === "bigint" ? Number(u.id) : u.id,
          }
    )

    return NextResponse.json({
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    })
  } catch (e: any) {
    const msg = typeof e?.message === "string" ? e.message : "Failed to fetch users"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
