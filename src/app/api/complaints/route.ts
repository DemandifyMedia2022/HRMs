import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendMail } from '@/lib/mailer';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { requireAuth } from '@/lib/middleware';
import { createLogger } from '@/lib/logger';
import { z } from 'zod';

const logger = createLogger('complaints');

const MAX_ATTACHMENT_SIZE = 50 * 1024 * 1024;

const complaintSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  department: z.enum(['sales', 'marketing', 'quality', 'it', 'csm', 'operation', 'development', 'hr']),
  Complaint_Type: z.enum([
    'Technical',
    'Non-Technical',
    'HR',
    'Admin',
    // Additional values observed in downstream switch/use
    'HRMs',
    'HARITECH HRMS Portal Issue',
    'HariDialer',
    'HR-related',
    'Other',
    'General'
  ]),
  Technical_SubType: z.string().optional(),
  Reson: z.string().min(10).max(1000),
  added_by_user: z.string().email()
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const name = searchParams.get('name') || undefined;
    const department = searchParams.get('department') || undefined;
    const issueType = searchParams.get('issuse_type') || undefined;
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const pageSize = Math.max(1, Number(searchParams.get('pageSize') || 10));

    const where: any = {};
    if (status) where.status = status;
    if (name) where.name = name;
    if (department) where.department = department;
    if (issueType) where.issuse_type = issueType;

    const [total, data] = await Promise.all([
      prisma.issuedata.count({ where }),
      prisma.issuedata.findMany({
        where,
        orderBy: { raisedate: 'desc' },
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
    const message = typeof e?.message === 'string' ? e.message : 'Failed to fetch complaints';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function detectAllowed(buf: Buffer): 'pdf' | 'png' | 'jpg' | 'jpeg' | 'webp' | null {
  if (buf.length >= 5 && buf.slice(0, 5).toString('ascii') === '%PDF-') return 'pdf';
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 && buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a) return 'png';
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.length >= 12 && buf.slice(8, 12).toString('ascii') === 'WEBP') return 'webp';
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;
    const formData = await req.formData();
    const candidate = {
      name: formData.get('name'),
      department: formData.get('department'),
      Complaint_Type: formData.get('Complaint_Type'),
      Technical_SubType: formData.get('Technical_SubType') ?? undefined,
      Reson: formData.get('Reson'),
      added_by_user: formData.get('added_by_user')
    } as Record<string, unknown>;

    const validation = complaintSchema.safeParse(candidate);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      );
    }

    const validated = validation.data;
    const name = validated.name;
    const department = validated.department;
    const complaintType = validated.Complaint_Type;
    const technicalSubType = validated.Technical_SubType || '';
    const reason = validated.Reson;
    const addedByUser = validated.added_by_user;
    const attachmentFile = formData.get('Attachment') as File | null;

    let attachmentPath: string | null = null;
    if (attachmentFile && attachmentFile.size > 0) {
      try {
        if (attachmentFile.size > MAX_ATTACHMENT_SIZE) {
          return NextResponse.json(
            { error: `File size exceeds maximum allowed size of ${Math.floor(MAX_ATTACHMENT_SIZE / 1024 / 1024)}MB` },
            { status: 413 }
          );
        }
        const bytes = await attachmentFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const kind = detectAllowed(buffer);
        if (!kind) {
          return NextResponse.json({ error: 'Unsupported file type' }, { status: 415 });
        }
        const uploadDir = join(process.cwd(), 'uploads', 'complaint_attachments');
        if (!existsSync(uploadDir)) {
          await mkdir(uploadDir, { recursive: true });
        }
        const timestamp = Date.now();
        const originalName = attachmentFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `${timestamp}_${originalName}`;
        const filePath = join(uploadDir, fileName);

        await writeFile(filePath, buffer);
        if (existsSync(filePath)) {
          attachmentPath = `/api/files/complaint_attachments/${fileName}`;
        } else {
          logger.error('File was not saved');
        }
      } catch (uploadError) {
        logger.error('File upload error', { error: (uploadError as any)?.message });
      }
    }

    // Build full issue type (like Laravel logic)
    let fullType = complaintType;
    if (complaintType === 'Technical' && technicalSubType) {
      fullType += ` (${technicalSubType})`;
    }

    const created = await prisma.issuedata.create({
      data: {
        name: String(name),
        department: String(department),
        issuse_type: String(fullType),
        reason: String(reason),
        added_by_user: String(addedByUser),
        status: 'Pending',
        raisedate: new Date()
      }
    });

    // Send email notification (best-effort)
    try {
      // Determine department email based on complaint type
      let deptEmail = 'viresh.kumbhar@demandifymedia.com';
      switch (complaintType) {
        case 'HRMs':
        case 'HARITECH HRMS Portal Issue':
          deptEmail = 'shraddha.adhav@demandifymedia.com';
          break;
        case 'HariDialer':
          deptEmail = 'rutuja.pawar@demandifymedia.com';
          break;
        case 'Technical':
          deptEmail = 'informationtechnology@demandifymedia.com';
          break;
        case 'HR-related':
          deptEmail = 'hr@demandifymedia.com';
          break;
        case 'Other':
          deptEmail = 'info@demandifymedia.com';
          break;
        case 'General':
        default:
          deptEmail = 'viresh.kumbhar@demandifymedia.com';
          break;
      }

      // Use provided user email for reply-to
      const userEmail = addedByUser || undefined;

      // Send only to department email, not to the user
      const recipients = [deptEmail];

      const subject = `🎫 New Complaint Raised by ${name}`;
      // Use actual server URL for emails (not localhost)
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || 'http://localhost:3000';
      const link = `${baseUrl}/pages/hr/complaints`;

      // Only include attachment if we have a valid public URL
      let attachmentInfo = '';
      if (attachmentPath) {
        if (baseUrl.includes('localhost')) {
          attachmentInfo = `<p><strong>📎 Attachment:</strong> File uploaded (accessible only on server)</p>`;
        } else {
          attachmentInfo = `<p><strong>📎 Attachment:</strong> <a href="${baseUrl}${attachmentPath}" target="_blank">View Attachment</a></p>`;
        }
      }
      const html = `
        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto; background-color: #f9f9f9; padding: 20px; border-radius: 8px; border: 1px solid #eee;'>
          <h2 style='color: #d32f2f; text-align: center;'>New Complaint Raised</h2>
          <p>Dear Team,</p>
          <p>A new complaint has been submitted. Please review the details below:</p>
          <p><strong> Name:</strong> ${name}</p>
          <p><strong> Department:</strong> ${department}</p>
          <p><strong>Issue Type:</strong> ${fullType}</p>
          <p><strong>Reason:</strong><br>${String(reason)}</p>
          ${attachmentInfo}
          <p><strong>Raised Date:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Status:</strong> Pending</p>
          <div style='text-align:center;margin-top:20px'>
            <a href='${link}' style='background-color:#d32f2f;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;'>View Complaint</a>
          </div>
          <hr style='margin: 30px 0;'>
          <p style='font-size: 13px; color: #888; text-align: center;'>This email was generated automatically by HRMS. Please do not reply.</p>
        </div>
      `;
      await sendMail({
        to: recipients,
        subject,
        html,
        replyTo: userEmail,
        text: `New complaint by ${name} (${userEmail || 'N/A'}). Department: ${department}. Type: ${fullType}. Reason: ${String(reason)}. View: ${link}`
      });
    } catch (emailError) {
      logger.error('Failed to send email', { error: (emailError as any)?.message });
      // Continue even if email fails
    }

    return NextResponse.json(
      { id: created.id, message: 'Complaint raised successfully', attachmentPath },
      { status: 201 }
    );
  } catch (e: any) {
    const message = typeof e?.message === 'string' ? e.message : 'Failed to create complaint';
    logger.error('Create complaint error', { error: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const id = Number(body?.id);
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const data: any = {};
    if (body?.status) data.status = String(body.status);
    if (body?.resolution_comment !== undefined) data.resolution_comment = String(body.resolution_comment);
    if (body?.resolved_by) data.resolved_by = String(body.resolved_by);
    if (body?.acknowledgement_status) data.acknowledgement_status = String(body.acknowledgement_status);
    if (body?.acknowledgement_by) data.acknowledgement_by = String(body.acknowledgement_by);
    if (body?.Attendance_status) data.Attendance_status = String(body.Attendance_status);
    if (body?.Attendance_Approval) data.Attendance_Approval = String(body.Attendance_Approval);
    if (body?.Attendance_feedback) data.Attendance_feedback = String(body.Attendance_feedback);

    if (body?.status === 'Resolved' && !data.resolved_date) {
      data.resolved_date = new Date();
    }
    if (body?.acknowledgement_status && !data.acknowledgement_date) {
      data.acknowledgement_date = new Date();
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 });
    }

    const updatedComplaint = await prisma.issuedata.update({
      where: { id },
      data
    });

    // Send email notification when ticket is acknowledged
    if (body?.acknowledgement_status === 'Acknowledged') {
      try {
        // Get user email
        const userRow = await prisma.$queryRaw<Array<{ email: string | null }>>`
          SELECT email FROM users WHERE Full_name = ${updatedComplaint.added_by_user} OR name = ${updatedComplaint.added_by_user} LIMIT 1
        `;
        const userEmail = userRow?.[0]?.email ? String(userRow[0].email) : null;

        if (userEmail) {
          const subject = `Your Ticket #${id} Has Been Acknowledged`;
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || 'http://localhost:3000';
          const link = `${baseUrl}/pages/user/RaiseComplaint/Raise-Tickets`;

          const html = `
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto; background-color: #f9f9f9; padding: 20px; border-radius: 8px; border: 1px solid #eee;'>
              <h2 style='color: #2563eb; text-align: center;'>Ticket Acknowledged</h2>
              <p>Dear ${updatedComplaint.name},</p>
              <p>Your ticket has been acknowledged and is being reviewed. Here are the details:</p>
              <div style='background-color: #fff; padding: 15px; border-radius: 5px; margin: 15px 0;'>
                <p><strong>Ticket ID:</strong> #${id}</p>
                <p><strong>Issue Type:</strong> ${updatedComplaint.issuse_type}</p>
                <p><strong> Your Issue:</strong><br>${updatedComplaint.reason}</p>
                <hr style='border: none; border-top: 1px solid #eee; margin: 15px 0;'>
                <p><strong>Acknowledged By:</strong> ${data.acknowledgement_by || 'Support Team'}</p>
                <p><strong>Acknowledged Date:</strong> ${new Date().toLocaleDateString()}</p>
                <p><strong>Status:</strong> <span style='color: #2563eb; font-weight: bold;'>Acknowledged</span></p>
              </div>
              <p>We are working on resolving your issue. You will receive another email once your ticket is resolved.</p>
              <div style='text-align: center; margin-top: 20px;'>
                <a href='${link}' style='display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px;'>View My Tickets</a>
              </div>
              <p style='color: #888; font-size: 12px; margin-top: 20px; text-align: center;'>
                This is an automated email. Please do not reply to this message.
              </p>
            </div>
          `;

          await sendMail({
            to: [userEmail],
            subject,
            html
          });
        }
      } catch (emailError) {
        logger.error('Failed to send acknowledgment email', { error: (emailError as any)?.message });
        // Don't fail the request if email fails
      }
    }

    // Send email notification when ticket is resolved
    if (body?.status === 'Resolved' && data.resolution_comment) {
      try {
        // Get user email
        const userRow = await prisma.$queryRaw<Array<{ email: string | null }>>`
          SELECT email FROM users WHERE Full_name = ${updatedComplaint.added_by_user} OR name = ${updatedComplaint.added_by_user} LIMIT 1
        `;
        const userEmail = userRow?.[0]?.email ? String(userRow[0].email) : null;

        if (userEmail) {
          const subject = ` Your Ticket #${id} Has Been Resolved`;
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || 'http://localhost:3000';
          const link = `${baseUrl}/pages/user/RaiseComplaint/Raise-Tickets`;

          const html = `
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto; background-color: #f9f9f9; padding: 20px; border-radius: 8px; border: 1px solid #eee;'>
              <h2 style='color: #16a34a; text-align: center;'>Ticket Resolved</h2>
              <p>Dear ${updatedComplaint.name},</p>
              <p>Your ticket has been successfully resolved. Here are the details:</p>
              <div style='background-color: #fff; padding: 15px; border-radius: 5px; margin: 15px 0;'>
                <p><strong>Ticket ID:</strong> #${id}</p>
                <p><strong>Issue Type:</strong> ${updatedComplaint.issuse_type}</p>
                <p><strong>Your Issue:</strong><br>${updatedComplaint.reason}</p>
                <hr style='border: none; border-top: 1px solid #eee; margin: 15px 0;'>
                <p><strong>Resolution:</strong><br>${data.resolution_comment}</p>
                <p><strong>Resolved By:</strong> ${data.resolved_by || 'Support Team'}</p>
                <p><strong>Resolved Date:</strong> ${new Date().toLocaleDateString()}</p>
              </div>
              <p>If you have any further questions or concerns, please don't hesitate to raise a new ticket.</p>
              <div style='text-align: center; margin-top: 20px;'>
                <a href='${link}' style='display: inline-block; padding: 12px 24px; background-color: #16a34a; color: white; text-decoration: none; border-radius: 5px;'>View My Tickets</a>
              </div>
              <p style='color: #888; font-size: 12px; margin-top: 20px; text-align: center;'>
                This is an automated email. Please do not reply to this message.
              </p>
            </div>
          `;

          await sendMail({
            to: [userEmail],
            subject,
            html
          });
        }
      } catch (emailError) {
        logger.error('Failed to send resolution email', { error: (emailError as any)?.message });
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({ ok: true, message: 'Complaint updated successfully' });
  } catch (e: any) {
    const message = typeof e?.message === 'string' ? e.message : 'Failed to update complaint';
    logger.error('Update complaint error', { error: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
