import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { sendMail } from "@/lib/mailer";

function toUtcMidnight(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map((n) => Number(n));
  return new Date(Date.UTC(y, (m as number) - 1, d));
}

async function getCurrentUser(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;
  if (!token) return null;
  try {
    const payload = verifyToken(token) as any;
    const user = await (prisma as any).users.findUnique({ where: { email: payload.email } });
    if (!user) return null;
    return {
      id: typeof user.id === "bigint" ? Number(user.id) : user.id,
      email: user.email as string,
      name: (user.Full_name ?? user.name ?? "") as string,
      role: String((user as any).type || payload.role || "user").toLowerCase(),
      department: (user as any).department ?? null,
      emp_code: String((user as any).emp_code ?? ""),
    };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined; // pending/approved/rejected
    const my = searchParams.get("my") === "1";
    const month = searchParams.get("month") || undefined; // YYYY-MM

    const where: any = { issuse_type: "Attendance" };
    if (status) where.status = status;

    if (month) {
      const [y, m] = month.split("-");
      const year = Number(y);
      const mon = Number(m) - 1;
      if (!isNaN(year) && !isNaN(mon)) {
        const start = new Date(Date.UTC(year, mon, 1));
        const end = new Date(Date.UTC(year, mon + 1, 0, 23, 59, 59, 999));
        where.Date_Attendance_Update = { gte: start, lte: end };
      }
    }

    if (my) {
      const me = await getCurrentUser(req);
      if (!me) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      where.added_by_user = me.name;
    }

    const data = await prisma.issuedata.findMany({
      where,
      orderBy: { raisedate: "desc" },
      take: 200,
    });

    return NextResponse.json({ data });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const me = await getCurrentUser(req);
    if (!me) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const dateStr: string = body?.date; // YYYY-MM-DD
    const desired_status: string = body?.desired_status; // Present/Half-day/Absent/Other
    const reason: string = body?.reason;

    if (!dateStr || !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(dateStr)) {
      return NextResponse.json({ message: "Invalid date" }, { status: 400 });
    }
    if (!desired_status || !reason) {
      return NextResponse.json({ message: "desired_status and reason are required" }, { status: 400 });
    }

    const created = await prisma.issuedata.create({
      data: {
        name: me.name,
        department: me.department ?? "",
        issuse_type: "Attendance",
        reason: String(reason),
        added_by_user: me.name,
        status: "pending",
        Date_Attendance_Update: toUtcMidnight(dateStr),
        Attendance_status: String(desired_status),
        Attendance_Approval: "pending",
        Attendance_feedback: null,
        raisedate: new Date(),
      },
    });

    // Email notify HR users (best-effort)
    try {
      const hrs = await prisma.$queryRaw<Array<{ email: string | null }>>`
        SELECT email FROM users 
        WHERE email IS NOT NULL AND (
          LOWER(department) = 'hr' OR UPPER(type) = 'HR'
        )
      `;
      const to = (hrs || []).map((r) => String(r.email)).filter(Boolean);
      if (to.length > 0) {
        const dateDisp = new Date(created.Date_Attendance_Update as any).toISOString().split('T')[0];
        const subject = `📅 Attendance Update Request Submitted by ${me.name}`;
        const link = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/pages/hr/attendance/request-update`;
        const html = `
          <div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto; background-color: #f9f9f9; padding: 20px; border-radius: 8px; border: 1px solid #eee;'>
            <h2 style='color: #1a73e8; text-align: center;'>📋 Attendance Update Request</h2>
            <p>Dear HR Team,</p>
            <p>I hope this message finds you well. A new attendance update request has been submitted. Please find the details below:</p>
            <p><strong>👤 User:</strong> ${me.name}</p>
            <p><strong>📧 Email:</strong> ${me.email}</p>
            <p><strong>🏢 Department:</strong> ${me.department ?? ''}</p>
            <p><strong>📅 Requested Date:</strong> ${dateDisp}</p>
            <p><strong>✅ Status:</strong> ${desired_status}</p>
            <p><strong>📝 Reason:</strong><br>${String(reason)}</p>
            <div style='text-align:center;margin-top:20px'>
              <a href='${link}' style='background-color:#007bff;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;'>Review Request</a>
            </div>
            <hr style='margin: 30px 0;'>
            <p style='font-size: 13px; color: #888; text-align: center;'>
              This email was generated automatically by HRMS (Demandify Media). Please do not reply.
            </p>
          </div>
        `;
        await sendMail({ to, subject, html, replyTo: me.email, text: `New attendance update request by ${me.name} (${me.email}) on ${dateDisp} -> ${desired_status}. Reason: ${String(reason)}. Review: ${link}` });
      }
    } catch {}

    return NextResponse.json({ id: created.id }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || "Failed" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const me = await getCurrentUser(req);
    if (!me) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    // Only HR/Admin can approve
    if (!["hr", "admin"].includes(String(me.role))) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const id = Number(body?.id);
    const approval: "approved" | "rejected" | undefined = body?.approval;
    const feedback: string | undefined = body?.feedback;

    if (!id || !approval) {
      return NextResponse.json({ message: "id and approval are required" }, { status: 400 });
    }

    const issue = await prisma.issuedata.findUnique({ where: { id } });
    if (!issue || issue.issuse_type !== "Attendance") {
      return NextResponse.json({ message: "Request not found" }, { status: 404 });
    }

    // Update issuedata first
    await prisma.issuedata.update({
      where: { id },
      data: {
        Attendance_Approval: approval,
        status: approval,
        Attendance_feedback: feedback ?? null,
        acknowledgement_status: approval === "approved" ? "acknowledged" : "rejected",
        acknowledgement_date: new Date(),
        resolved_date: new Date(),
        resolved_by: me.name,
        acknowledgement_by: me.name,
      },
    });

    // Notify requester via email (best-effort)
    try {
      const userRow = await prisma.$queryRaw<Array<{ email: string | null }>>`
        SELECT email FROM users WHERE Full_name = ${issue.added_by_user} OR name = ${issue.added_by_user} LIMIT 1
      `;
      const toEmail = userRow?.[0]?.email ? String(userRow[0].email) : null;
      if (toEmail) {
        const dateDisp = issue.Date_Attendance_Update
          ? new Date(issue.Date_Attendance_Update as any).toISOString().split('T')[0]
          : '';
        const subject = `[HRMS] Your attendance request has been ${approval}`;
        const link = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/pages/hr/attendance/request-update`;
        const html = `
          <div>
            <p>Hello ${issue.added_by_user || ''},</p>
            <p>Your attendance update request has been <strong>${approval}</strong>.</p>
            <ul>
              <li><strong>Date:</strong> ${dateDisp}</li>
              <li><strong>Status requested:</strong> ${issue.Attendance_status || ''}</li>
              ${feedback ? `<li><strong>Feedback:</strong> ${feedback}</li>` : ''}
            </ul>
            <p>You can view request status here: <a href="${link}">${link}</a></p>
          </div>
        `;
        await sendMail({ to: [toEmail], subject, html, text: `Your attendance request (${dateDisp}) is ${approval}. ${feedback ? 'Feedback: ' + feedback : ''} Review: ${link}` });
      }
    } catch {}

    if (approval === "approved") {
      // Apply to NpAttendance
      const date = issue.Date_Attendance_Update as unknown as Date | null;
      const desired = issue.Attendance_status as string | null;

      if (date && desired) {
        // resolve employee emp_code from users by name (added_by_user)
        const users = await prisma.$queryRaw<Array<{ emp_code: string | null }>>`
          SELECT emp_code FROM users WHERE Full_name = ${issue.added_by_user} OR name = ${issue.added_by_user} LIMIT 1
        `;
        const emp_code = users?.[0]?.emp_code ? Number(users[0].emp_code) : (me.emp_code ? Number(me.emp_code) : NaN);
        if (!isNaN(emp_code)) {
          // Try update, else create
          const upd = await prisma.npAttendance.updateMany({ where: { employeeId: emp_code, date }, data: { status: desired } });
          if (!upd.count || upd.count === 0) {
            try {
              await prisma.npAttendance.create({
                data: {
                  employeeId: emp_code,
                  empName: issue.added_by_user ?? me.name,
                  date,
                  inTime: date,
                  outTime: date,
                  clockTimes: "[]",
                  totalHours: "00:00:00" as any,
                  loginHours: "00:00:00" as any,
                  breakHours: "00:00:00" as any,
                  status: desired,
                } as any,
              });
            } catch {
              await prisma.npAttendance.updateMany({ where: { employeeId: emp_code, date }, data: { status: desired } });
            }
          }
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || "Failed" }, { status: 500 });
  }
}
