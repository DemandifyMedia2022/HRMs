import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

function csvEscape(val: any): string {
  if (val === null || val === undefined) return "";
  const s = String(val);
  if (s.includes(",") || s.includes("\n") || s.includes('"')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const year = Number(url.searchParams.get("year") || new Date().getFullYear());
    const month = Number(url.searchParams.get("month") || new Date().getMonth() + 1); // 1-12
    const employeeId = url.searchParams.get("employeeId");
    if (!employeeId) {
      return new Response(JSON.stringify({ error: "employeeId is required" }), { status: 400 });
    }
    if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
      return new Response(JSON.stringify({ error: "Invalid year/month" }), { status: 400 });
    }

    const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const end = new Date(Date.UTC(year, month, 0, 23, 59, 59));

    const rows: Array<any> = await prisma.$queryRaw`
      SELECT 
        a.employee_id        AS employeeId,
        COALESCE(u.Full_name, a.emp_name) AS employeeName,
        a.date               AS date,
        a.in_time            AS inTime,
        a.out_time           AS outTime,
        a.login_hours        AS loginHours,
        a.total_hours        AS totalHours,
        a.break_hours        AS breakHours,
        a.status             AS status,
        s.shift_time         AS shiftTime
      FROM npattendance a
      LEFT JOIN users u ON u.emp_code = a.employee_id
      LEFT JOIN shift_time s ON s.biomatric_id = a.employee_id
      WHERE a.date BETWEEN ${start} AND ${end}
        AND a.employee_id = ${employeeId}
      ORDER BY a.date ASC
    `;

    const header = [
      "employee_id",
      "employee_name",
      "date",
      "in_time",
      "out_time",
      "shift_time",
      "status",
      "login_hours",
      "total_hours",
      "break_hours",
    ];

    const lines: string[] = [];
    lines.push(header.join(","));
    for (const r of rows) {
      const dateISO = new Date(r.date).toISOString().split("T")[0];
      const inT = r.inTime ? new Date(r.inTime).toISOString().substring(11, 19) : "";
      const outT = r.outTime ? new Date(r.outTime).toISOString().substring(11, 19) : "";
      lines.push([
        csvEscape(r.employeeId),
        csvEscape(r.employeeName || ""),
        csvEscape(dateISO),
        csvEscape(inT),
        csvEscape(outT),
        csvEscape(r.shiftTime || ""),
        csvEscape(r.status || ""),
        csvEscape(r.loginHours || ""),
        csvEscape(r.totalHours || ""),
        csvEscape(r.breakHours || ""),
      ].join(","));
    }

    const body = lines.join("\n");
    const filename = `Monthly-Attendance-${employeeId}-${year}-${String(month).padStart(2, "0")}.csv`;
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=${filename}`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Export failed" }), { status: 500 });
  }
}
