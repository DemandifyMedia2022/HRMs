import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendMail } from '@/lib/mailer';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

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
    // Handle both FormData and JSON requests
    let leaveType: string;
    let startDate: string;
    let endDate: string;
    let reason: string;
    let addedByUser: string;
    let providedCompany: string | null;
    let attachmentName: string | null = null;
    
    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('multipart/form-data')) {
      // Handle FormData (for file uploads)
      const formData = await req.formData();
      leaveType = String(formData.get('Leave_Type') || '');
      startDate = String(formData.get('Leave_Start_Date') || '');
      endDate = String(formData.get('Leave_End_Date') || '');
      reason = String(formData.get('Reson') || '');
      addedByUser = String(formData.get('added_by_user') || '');
      providedCompany = String(formData.get('client_company_name') || null);
      
      // Get attachment and save it if present
      const attachment = formData.get('attachment') as File;
      if (attachment && attachment.size > 0) {
        // Create uploads directory if it doesn't exist
        const uploadsDir = join(process.cwd(), 'uploads', 'leave-attachments');
        if (!existsSync(uploadsDir)) {
          await mkdir(uploadsDir, { recursive: true });
        }
        
        // Generate unique filename
        const timestamp = Date.now();
        const sanitizedFileName = attachment.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `${timestamp}_${sanitizedFileName}`;
        const filePath = join(uploadsDir, fileName);
        
        // Save file to disk
        const bytes = await attachment.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filePath, buffer);
        
        // Store the relative path for email attachment
        attachmentName = fileName;
      }
    } else {
      // Handle JSON (backward compatibility)
      const body = await req.json();
      leaveType = body?.Leave_Type ?? body?.leave_type ?? '';
      startDate = body?.Leave_Start_Date ?? body?.start_date ?? '';
      endDate = body?.Leave_End_Date ?? body?.end_date ?? '';
      reason = body?.Reson ?? body?.reason ?? '';
      addedByUser = body?.added_by_user ?? body?.addedByUser ?? 'unknown';
      providedCompany = body?.client_company_name ?? body?.company ?? null;
    }

    if (!leaveType || !startDate || !endDate || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Resolve employee's company using the normalized addedByUser.
    // This must be resilient because the UI may pass Full_name, name, or email.
    const isEmail = typeof addedByUser === 'string' && addedByUser.includes('@');
    const local = isEmail ? String(addedByUser).split('@')[0] : String(addedByUser);
    const tokens = local.split(/[._\s]+/).filter(Boolean);

    const emp = await prisma.users.findFirst({
      where: isEmail
        ? { email: String(addedByUser) }
        : tokens.length
          ? { AND: tokens.map((t: string) => ({ OR: [{ name: { contains: t } }, { Full_name: { contains: t } }] })) }
          : { OR: [{ Full_name: String(addedByUser) }, { name: String(addedByUser) }] },
      select: { client_company_name: true, Full_name: true, name: true, emp_code: true }
    });

    const client_company_name = emp?.client_company_name || providedCompany || null;
    // Always store the name, not the email
    const employeeName = emp?.Full_name || emp?.name || String(addedByUser);

    const empCode = emp?.emp_code ? String(emp.emp_code) : null;



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
        attachment: attachmentName,
        leaveregdate: new Date(),
        added_by_user: String(employeeName),
        client_company_name,
        emp_code: empCode
      }
    });

    // Email notify HR users and reporting manager for any leave submission
    try {
      let recipients: string[] = [];
      
      // Get requester information
      const requester = await prisma.$queryRaw<Array<{ email: string | null; department: string | null; type: string | null; reporting_manager: string | null }>>`
        SELECT email, department, type, reporting_manager FROM users WHERE Full_name = ${addedByUser} OR name = ${addedByUser} LIMIT 1
      `;
      const requesterDept = requester?.[0]?.department ? String(requester[0].department) : '';
      const requesterType = requester?.[0]?.type ? String(requester[0].type) : '';
      const requesterEmail = requester?.[0]?.email ? String(requester[0].email) : undefined;
      const reportingManagerName = requester?.[0]?.reporting_manager ? String(requester[0].reporting_manager) : null;
      
      // Always notify HR users for any leave submission
      const hrs = await prisma.$queryRaw<Array<{ email: string | null }>>`
        SELECT email FROM users 
        WHERE email IS NOT NULL AND (
          LOWER(department) = 'hr' OR UPPER(type) = 'HR'
        )
      `;
      const hrEmails = (hrs || []).map(r => String(r.email)).filter(Boolean);
      
      // Add reporting manager to recipients if they exist
      if (reportingManagerName) {
        const manager = await prisma.$queryRaw<Array<{ email: string | null }>>`
          SELECT email FROM users 
          WHERE (Full_name = ${reportingManagerName} OR name = ${reportingManagerName}) 
          AND email IS NOT NULL
          LIMIT 1
        `;
        const managerEmail = manager?.[0]?.email ? String(manager[0].email) : null;
        if (managerEmail && !hrEmails.includes(managerEmail)) {
          recipients = [...hrEmails, managerEmail];
        } else {
          recipients = hrEmails;
        }
      } else {
        recipients = hrEmails;
      }

      if (recipients.length > 0) {
        const dateDisp =
          new Date(created.start_date as any).toISOString().split('T')[0] +
          (created.end_date && created.end_date !== created.start_date
            ? ` → ${new Date(created.end_date as any).toISOString().split('T')[0]}`
            : '');
        const subject = `📝 Leave Request Submitted by ${addedByUser}`;
        const link = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/pages/hr/leaves`;
        
        // Check for attachment info stored in attachment column
        let attachmentInfo = '';
        let emailAttachments: Array<{ filename: string; content: Buffer; contentType?: string }> = [];
        
        if (created.attachment) {
          const fileName = created.attachment;
          attachmentInfo = `<p><strong>📎 Attachment:</strong> ${fileName}</p>`;
          
          // Read the saved file and add as email attachment
          try {
            const filePath = join(process.cwd(), 'uploads', 'leave-attachments', fileName);
            const fs = await import('fs/promises');
            const fileBuffer = await fs.readFile(filePath);
            
            // Determine content type based on file extension
            const ext = fileName.split('.').pop()?.toLowerCase();
            let contentType = 'application/octet-stream';
            if (ext === 'pdf') contentType = 'application/pdf';
            else if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg';
            else if (ext === 'png') contentType = 'image/png';
            
            emailAttachments.push({
              filename: fileName,
              content: fileBuffer,
              contentType
            });
          } catch (fileError) {
            console.error('Failed to read attachment file:', fileError);
          }
        }
        
        // Determine appropriate greeting based on recipients
        const greeting = reportingManagerName ? 'Dear HR Team and Reporting Manager,' : 'Dear HR Team,';
        
        const html = `
          <div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto; background-color: #f9f9f9; padding: 20px; border-radius: 8px; border: 1px solid #eee;'>
            <h2 style='color: #1a73e8; text-align: center;'>📋 Leave Request</h2>
            <p>${greeting}</p>
            <p>A new leave request has been submitted. Please review the details below:</p>
            <p><strong>👤 User:</strong> ${addedByUser}</p>
            <p><strong>📧 Email:</strong> ${requesterEmail || 'N/A'}</p>
            <p><strong>🏢 Department:</strong> ${requesterDept}</p>
            ${reportingManagerName ? `<p><strong>👨‍💼 Reporting Manager:</strong> ${reportingManagerName}</p>` : ''}
            <p><strong>📅 Dates:</strong> ${dateDisp}</p>
            <p><strong>🏷️ Type:</strong> ${created.leave_type}</p>
            <p><strong>📝 Reason:</strong><br>${String(reason)}</p>
            ${attachmentInfo}
            <div style='text-align:center;margin-top:20px'>
              <a href='${link}' style='background-color:#007bff;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;'>Review Request</a>
            </div>
            <hr style='margin: 30px 0;'>
            <p style='font-size: 13px; color: #888; text-align: center;'>This email was generated automatically by HRMS. Please do not reply.</p>
          </div>
        `;
        
        const textContent = `Leave request by ${addedByUser} (${requesterEmail || 'N/A'}) ${dateDisp} Type: ${created.leave_type}. Reason: ${String(reason)}${attachmentInfo ? '. Attachment: ' + attachmentInfo.replace(/<[^>]*>/g, '') : ''}. Review: ${link}`;
        
        await sendMail({
          to: recipients,
          subject,
          html,
          replyTo: requesterEmail,
          text: textContent,
          attachments: emailAttachments.length > 0 ? emailAttachments : undefined
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
    console.log('PATCH request body:', body);
    const id = Number(body?.id);
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const data: any = {};
    if (body?.HRapproval) data.HRapproval = String(body.HRapproval);
    if (body?.HRrejectReason !== undefined) data.HRrejectReason = String(body.HRrejectReason);
    if (body?.Managerapproval) data.Managerapproval = String(body.Managerapproval);
    if (body?.ManagerRejecjetReason !== undefined) data.ManagerRejecjetReason = String(body.ManagerRejecjetReason);
    if (body?.hr_approved_by !== undefined) data.hr_approved_by = String(body.hr_approved_by);
    if (body?.manager_approved_by !== undefined) data.manager_approved_by = String(body.manager_approved_by);

    console.log('PATCH data to update:', data);

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 });
    }

    const before = await prisma.leavedata.findUnique({ where: { l_id: id } });
    await prisma.leavedata.update({
      where: { l_id: id },
      data
    });
    const after = await prisma.leavedata.findUnique({ where: { l_id: id } });

    // Get current manager (who is making the decision)
    let currentManagerEmail = null;
    try {
      const token = (req as any).cookies?.get('access_token')?.value;
      if (token) {
        const { verifyToken } = await import('@/lib/auth');
        const session = verifyToken(token);
        if (session?.email) {
          const manager = await prisma.users.findUnique({
            where: { email: session.email },
            select: { email: true, Full_name: true, name: true }
          });
          currentManagerEmail = manager?.email || null;
        }
      }
    } catch {}

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
        
        // Send confirmation email to the manager who made the decision
        if (currentManagerEmail && (body?.Managerapproval || body?.HRapproval)) {
          const managerSubject = `[HRMS] Your Decision Recorded: Leave request for ${after.added_by_user}`;
          const managerHtml = `
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto; background-color: #f9f9f9; padding: 20px; border-radius: 8px; border: 1px solid #eee;'>
              <p>Dear Manager,</p>
              <p>Your decision has been successfully recorded for the following leave request:</p>
              <ul>
                <li><strong>Employee:</strong> ${after.added_by_user}</li>
                <li><strong>Dates:</strong> ${dates}</li>
                <li><strong>Type:</strong> ${after.leave_type}</li>
                ${body?.Managerapproval ? `<li><strong>Your Decision:</strong> ${String(body.Managerapproval)}${body?.ManagerRejecjetReason && body?.ManagerRejecjetReason !== 'pending' ? ` — ${String(body.ManagerRejecjetReason)}` : ''}</li>` : ''}
                ${body?.HRapproval ? `<li><strong>HR Status:</strong> ${String(body.HRapproval)}${body?.HRrejectReason && body?.HRrejectReason !== 'pending' ? ` — ${String(body.HRrejectReason)}` : ''}</li>` : ''}
              </ul>
              <p>This is a confirmation that your decision has been saved in the system.</p>
              <hr style='margin: 30px 0;'>
              <p style='font-size: 13px; color: #888; text-align: center;'>This email was generated automatically by HRMS. Please do not reply.</p>
            </div>
          `;
          
          await sendMail({
            to: [currentManagerEmail],
            subject: managerSubject,
            html: managerHtml,
            text: `Your decision for ${after.added_by_user}'s leave request (${dates}) has been recorded. ${statusParts.join(', ')}.`
          });
        }
        
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
          // Admin notifications removed - admins will no longer receive email notifications for leave decisions
          // This section is intentionally left empty to remove admin email functionality
        }
      }
    } catch {}

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const message = typeof e?.message === 'string' ? e.message : 'Failed to update leave';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
