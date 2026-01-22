import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendMail } from '@/lib/mailer';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const leave_type = searchParams.get('leave_type') || undefined;
    const month = searchParams.get('month') || undefined; // expects YYYY-MM
    const user_name = searchParams.get('user_name') || undefined;
    const Leaves_Status = searchParams.get('Leaves_Status') || undefined;
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const pageSize = Math.max(1, Number(searchParams.get('pageSize') || 10));

    const where: any = {};
    if (leave_type) where.leave_type = leave_type;
    if (user_name) where.added_by_user = user_name;
    if (Leaves_Status) where.HRapproval = Leaves_Status;

    if (month) {
      const [y, m] = month.split('-');
      const year = Number(y);
      const mon = Number(m) - 1;
      if (!isNaN(year) && !isNaN(mon)) {
        const start = new Date(Date.UTC(year, mon, 1));
        const end = new Date(Date.UTC(year, mon + 1, 0, 23, 59, 59, 999));
        where.start_date = { gte: start, lte: end };
      }
    }

    const [total, data] = await Promise.all([
      prisma.leavedata.count({ where }),
      prisma.leavedata.findMany({
        where,
        orderBy: { start_date: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ]);

    return NextResponse.json({
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize) || 1
      }
    });
  } catch (e: any) {
    const message = typeof e?.message === 'string' ? e.message : 'Failed to fetch leavedata';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const leaveType = body?.Leave_Type ?? body?.leave_type;
    const startDate = body?.Leave_Start_Date ?? body?.start_date;
    const endDate = body?.Leave_End_Date ?? body?.end_date;
    const reason = body?.Reson ?? body?.reason;
    const addedByUser = body?.added_by_user ?? body?.addedByUser ?? 'unknown';

    if (!leaveType || !startDate || !endDate || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }



     // Resolve employee's company using the normalized addedByUser
   // Resolve employee's company using the normalized addedByUser
const isEmail = typeof addedByUser === 'string' && addedByUser.includes('@');
const emp = await prisma.users.findFirst({
  where: isEmail
    ? { email: addedByUser }
    : { OR: [{ Full_name: addedByUser }, { name: addedByUser }] },
  select: { client_company_name: true, Full_name: true, name: true }
});
const client_company_name = emp?.client_company_name || null;
// Always store the name, not the email
const employeeName = emp?.Full_name || emp?.name || addedByUser;



    const created = await prisma.leavedata.create({
      data: {
        leave_type: String(leaveType),
        start_date: new Date(startDate),
        end_date: new Date(endDate),
        reason: String(reason),
        HRapproval: 'pending',
        HRrejectReason: 'pending',
        Managerapproval: 'pending',
        ManagerRejecjetReason: 'pending',
        leaveregdate: new Date(),
        added_by_user: String(employeeName),
        client_company_name
      }
    });

    // Email notify appropriate recipients based on applicant role
    try {
      let recipients: string[] = [];
      let recipientType = '';
      
      // Check if requester is from HR department
      const requester = await prisma.$queryRaw<Array<{ email: string | null; department: string | null; type: string | null }>>`
        SELECT email, department, type FROM users WHERE Full_name = ${addedByUser} OR name = ${addedByUser} LIMIT 1
      `;
      const requesterDept = requester?.[0]?.department ? String(requester[0].department) : '';
      const requesterType = requester?.[0]?.type ? String(requester[0].type) : '';
      const requesterEmail = requester?.[0]?.email ? String(requester[0].email) : undefined;
      
      // Determine recipients based on requester role
      const isHRUser = requesterDept.toLowerCase() === 'hr' || requesterType.toUpperCase() === 'HR';
      
      if (isHRUser) {
        // If HR user applies, notify Admin users
        const admins = await prisma.$queryRaw<Array<{ email: string | null }>>`
          SELECT email FROM users 
          WHERE email IS NOT NULL AND (
            LOWER(type) = 'admin' OR UPPER(type) = 'ADMIN'
          )
        `;
        recipients = (admins || []).map(r => String(r.email)).filter(Boolean);
        recipientType = 'Admin Team';
      } else {
        // If regular user applies, notify HR users
        const hrs = await prisma.$queryRaw<Array<{ email: string | null }>>`
          SELECT email FROM users 
          WHERE email IS NOT NULL AND (
            LOWER(department) = 'hr' OR UPPER(type) = 'HR'
          )
        `;
        recipients = (hrs || []).map(r => String(r.email)).filter(Boolean);
        recipientType = 'HR Team';
      }

      if (recipients.length > 0) {
        const dateDisp =
          new Date(created.start_date as any).toISOString().split('T')[0] +
          (created.end_date && created.end_date !== created.start_date
            ? ` → ${new Date(created.end_date as any).toISOString().split('T')[0]}`
            : '');
        const subject = `📝 Leave Request Submitted by ${addedByUser}`;
        const link = isHRUser 
          ? `${process.env.NEXT_PUBLIC_BASE_URL || ''}/pages/admin/leaves` 
          : `${process.env.NEXT_PUBLIC_BASE_URL || ''}/pages/hr/leaves`;
        const html = `
          <div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto; background-color: #f9f9f9; padding: 20px; border-radius: 8px; border: 1px solid #eee;'>
            <h2 style='color: #1a73e8; text-align: center;'>📋 Leave Request</h2>
            <p>Dear ${recipientType},</p>
            <p>A new leave request has been submitted. Please review the details below:</p>
            <p><strong>👤 User:</strong> ${addedByUser}</p>
            <p><strong>📧 Email:</strong> ${requesterEmail || 'N/A'}</p>
            <p><strong>🏢 Department:</strong> ${requesterDept}</p>
            <p><strong>📅 Dates:</strong> ${dateDisp}</p>
            <p><strong>🏷️ Type:</strong> ${created.leave_type}</p>
            <p><strong>📝 Reason:</strong><br>${String(reason)}</p>
            <div style='text-align:center;margin-top:20px'>
              <a href='${link}' style='background-color:#007bff;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;'>Review Request</a>
            </div>
            <hr style='margin: 30px 0;'>
            <p style='font-size: 13px; color: #888; text-align: center;'>This email was generated automatically by HRMS. Please do not reply.</p>
          </div>
        `;
        await sendMail({
          to: recipients,
          subject,
          html,
          replyTo: requesterEmail,
          text: `Leave request by ${addedByUser} (${requesterEmail || 'N/A'}) ${dateDisp} Type: ${created.leave_type}. Reason: ${String(reason)}. Review: ${link}`
        });
      }
    } catch {}

    return NextResponse.json({ id: created.l_id }, { status: 201 });
  } catch (e: any) {
    const message = typeof e?.message === 'string' ? e.message : 'Failed to create leave';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const id = Number(body?.id);
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const data: any = {};
    if (body?.HRapproval) data.HRapproval = String(body.HRapproval);
    if (body?.HRrejectReason !== undefined) data.HRrejectReason = String(body.HRrejectReason);
    if (body?.Managerapproval) data.Managerapproval = String(body.Managerapproval);
    if (body?.ManagerRejecjetReason !== undefined) data.ManagerRejecjetReason = String(body.ManagerRejecjetReason);

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 });
    }

    const before = await prisma.leavedata.findUnique({ where: { l_id: id } });
    await prisma.leavedata.update({
      where: { l_id: id },
      data
    });
    const after = await prisma.leavedata.findUnique({ where: { l_id: id } });

    // Notify requester and appropriate parties of decision changes
    try {
      if (after) {
        const userRow = await prisma.$queryRaw<Array<{ email: string | null; department: string | null; type: string | null }>>`
          SELECT email, department, type FROM users WHERE Full_name = ${after.added_by_user} OR name = ${after.added_by_user} LIMIT 1
        `;
        const requesterInfo = userRow?.[0];
        const toEmail = requesterInfo?.email ? String(requesterInfo.email) : null;
        
        // Define variables in proper scope for use in all conditional blocks
        const startDisp = after.start_date ? new Date(after.start_date as any).toISOString().split('T')[0] : '';
        const endDisp = after.end_date ? new Date(after.end_date as any).toISOString().split('T')[0] : '';
        const dates = endDisp && endDisp !== startDisp ? `${startDisp} → ${endDisp}` : startDisp;
        
        const statusParts: string[] = [];
        if (body?.HRapproval) statusParts.push(`HR: ${String(body.HRapproval)}`);
        if (body?.Managerapproval) statusParts.push(`Manager: ${String(body.Managerapproval)}`);
        
        if (toEmail) {
          const link = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/pages/user/leaves`;

          const subject = `[HRMS] Your leave request update: ${statusParts.join(', ') || 'Updated'}`;

          const html = `
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto; background-color: #f9f9f9; padding: 20px; border-radius: 8px; border: 1px solid #eee;'>
              <p>Hello ${after.added_by_user},</p>
              <p>Your leave request has been updated.</p>
              <ul>
                <li><strong>Dates:</strong> ${dates}</li>
                <li><strong>Type:</strong> ${after.leave_type}</li>
                ${body?.HRapproval ? `<li><strong>HR:</strong> ${String(body.HRapproval)}${body?.HRrejectReason ? ` — ${String(body.HRrejectReason)}` : ''}</li>` : ''}
                ${body?.Managerapproval ? `<li><strong>Manager:</strong> ${String(body.Managerapproval)}${body?.ManagerRejecjetReason ? ` — ${String(body.ManagerRejecjetReason)}` : ''}</li>` : ''}
              </ul>
              <p>You can view your request here: <a href='${link}'>${link}</a></p>
            </div>
          `;
          await sendMail({
            to: [toEmail],
            subject,
            html,
            text: `Your leave request for ${dates} (${after.leave_type}) updated. ${statusParts.join(', ')}. View: ${link}`
          });
        }

        // Also notify other relevant parties if the request was made by HR and approved/rejected by Admin
        // or if the request was made by user and approved/rejected by HR
        const isHRRequester = requesterInfo?.department?.toLowerCase() === 'hr' || requesterInfo?.type?.toUpperCase() === 'HR';
        
        if (isHRRequester && (body?.HRapproval || body?.Managerapproval)) {
          // Notify other HR members when HR's leave is approved/rejected
          try {
            const otherHRs = await prisma.$queryRaw<Array<{ email: string | null }>>`
              SELECT email FROM users 
              WHERE email IS NOT NULL AND (
                LOWER(department) = 'hr' OR UPPER(type) = 'HR'
              ) AND email != ${toEmail}
            `;
            const hrEmails = (otherHRs || []).map(r => String(r.email)).filter(Boolean);
            
            if (hrEmails.length > 0) {
              const notifySubject = `[HRMS] HR Leave Request Update: ${after.added_by_user}`;
              const notifyHtml = `
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto; background-color: #f9f9f9; padding: 20px; border-radius: 8px; border: 1px solid #eee;'>
                  <p>Dear HR Team,</p>
                  <p>A leave request submitted by ${after.added_by_user} has been updated:</p>
                  <ul>
                    <li><strong>Dates:</strong> ${dates}</li>
                    <li><strong>Type:</strong> ${after.leave_type}</li>
                    ${body?.HRapproval ? `<li><strong>HR:</strong> ${String(body.HRapproval)}${body?.HRrejectReason ? ` — ${String(body.HRrejectReason)}` : ''}</li>` : ''}
                    ${body?.Managerapproval ? `<li><strong>Manager:</strong> ${String(body.Managerapproval)}${body?.ManagerRejecjetReason ? ` — ${String(body.ManagerRejecjetReason)}` : ''}</li>` : ''}
                  </ul>
                </div>
              `;
              await sendMail({
                to: hrEmails,
                subject: notifySubject,
                html: notifyHtml,
                text: `HR leave request by ${after.added_by_user} updated. ${statusParts.join(', ')}.`
              });
            }
          } catch {}
        } else if (!isHRRequester && (body?.HRapproval || body?.Managerapproval)) {
          // Notify Admin when user's leave is approved/rejected by HR (for record keeping)
          try {
            const admins = await prisma.$queryRaw<Array<{ email: string | null }>>`
              SELECT email FROM users 
              WHERE email IS NOT NULL AND (
                LOWER(type) = 'admin' OR UPPER(type) = 'ADMIN'
              )
            `;
            const adminEmails = (admins || []).map(r => String(r.email)).filter(Boolean);
            
            if (adminEmails.length > 0) {
              const notifySubject = `[HRMS] User Leave Request Update: ${after.added_by_user}`;
              const notifyHtml = `
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto; background-color: #f9f9f9; padding: 20px; border-radius: 8px; border: 1px solid #eee;'>
                  <p>Dear Admin Team,</p>
                  <p>A user leave request has been updated:</p>
                  <ul>
                    <li><strong>User:</strong> ${after.added_by_user}</li>
                    <li><strong>Dates:</strong> ${dates}</li>
                    <li><strong>Type:</strong> ${after.leave_type}</li>
                    ${body?.HRapproval ? `<li><strong>HR:</strong> ${String(body.HRapproval)}${body?.HRrejectReason ? ` — ${String(body.HRrejectReason)}` : ''}</li>` : ''}
                    ${body?.Managerapproval ? `<li><strong>Manager:</strong> ${String(body.Managerapproval)}${body?.ManagerRejecjetReason ? ` — ${String(body.ManagerRejecjetReason)}` : ''}</li>` : ''}
                  </ul>
                </div>
              `;
              await sendMail({
                to: adminEmails,
                subject: notifySubject,
                html: notifyHtml,
                text: `User leave request by ${after.added_by_user} updated. ${statusParts.join(', ')}.`
              });
            }
          } catch {}
        }
      }
    } catch {}

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const message = typeof e?.message === 'string' ? e.message : 'Failed to update leave';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
