import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendMail } from "@/lib/mailer"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"
import { requireAuth } from '@/lib/middleware';
import { createLogger } from '@/lib/logger';
import { z } from 'zod';

const logger = createLogger('complaints');

const complaintSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  department: z.string().min(1, 'Department is required'),
  complaintType: z.string().min(1, 'Complaint type is required'),
  technicalSubType: z.string().optional().nullable(),
  reason: z.string().min(1, 'Reason is required'),
  addedByUser: z.string().min(1).default('unknown'),
});

const updateComplaintSchema = z.object({
  id: z.number().int().positive(),
  status: z.string().optional(),
  resolution_comment: z.string().optional(),
  resolved_by: z.string().optional(),
  acknowledgement_status: z.string().optional(),
  acknowledgement_by: z.string().optional(),
  Attendance_status: z.string().optional(),
  Attendance_Approval: z.string().optional(),
  Attendance_feedback: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status") || undefined
    const name = searchParams.get("name") || undefined
    const issueType = searchParams.get("issuse_type") || undefined
    const page = Math.max(1, Number(searchParams.get("page") || 1))
    const pageSize = Math.max(1, Number(searchParams.get("pageSize") || 10))

    const where: any = {}
    if (status) where.status = status
    if (name) where.name = name
    if (issueType) where.issuse_type = issueType

    const [total, data] = await Promise.all([
      prisma.issuedata.count({ where }),
      prisma.issuedata.findMany({
        where,
        orderBy: { raisedate: "desc" },
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
    const message = typeof e?.message === "string" ? e.message : "Failed to fetch complaints"
    logger.error('Failed to fetch complaints', { error: message });
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = requireAuth(req as any);
    if (auth instanceof NextResponse) return auth;

    const formData = await req.formData()
    const raw = {
      name: formData.get("name"),
      department: formData.get("department"),
      complaintType: formData.get("Complaint_Type"),
      technicalSubType: formData.get("Technical_SubType"),
      reason: formData.get("Reson"),
      addedByUser: formData.get("added_by_user") ?? "unknown",
    };

    const parsed = complaintSchema.safeParse({
      name: raw.name ?? '',
      department: raw.department ?? '',
      complaintType: raw.complaintType ?? '',
      technicalSubType: raw.technicalSubType ?? undefined,
      reason: raw.reason ?? '',
      addedByUser: raw.addedByUser ?? 'unknown',
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          issues: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { name, department, complaintType, technicalSubType, reason, addedByUser } = parsed.data;
    const attachmentFile = formData.get("Attachment") as File | null

    // Handle file upload
    let attachmentPath: string | null = null
    if (attachmentFile && attachmentFile.size > 0) {
      try {
        const bytes = await attachmentFile.arrayBuffer()
        const buffer = Buffer.from(bytes)
        
        // Create uploads directory if it doesn't exist
        const uploadDir = join(process.cwd(), "public", "complaint_attachments")
        if (!existsSync(uploadDir)) {
          await mkdir(uploadDir, { recursive: true })
          logger.info('Created complaint attachment directory', { uploadDir });
        }
        
        // Generate unique filename
        const timestamp = Date.now()
        const originalName = attachmentFile.name.replace(/[^a-zA-Z0-9.-]/g, "_")
        const fileName = `${timestamp}_${originalName}`
        const filePath = join(uploadDir, fileName)
        
        await writeFile(filePath, buffer)
        
        // Verify file was written
        if (existsSync(filePath)) {
          attachmentPath = `/complaint_attachments/${fileName}`
          logger.info('Complaint attachment uploaded', { filePath, attachmentPath });
        } else {
          logger.error('Complaint attachment was not saved', { filePath });
        }
      } catch (uploadError) {
        logger.error('File upload error', {
          error: (uploadError as any)?.message,
          uploadDir: join(process.cwd(), "public", "complaint_attachments"),
        });
        // Continue without attachment if upload fails
      }
    }

    // Build full issue type (like Laravel logic)
    let fullType = complaintType
    if (complaintType === "Technical" && technicalSubType) {
      fullType += ` (${technicalSubType})`
    }

    const created = await prisma.issuedata.create({
      data: {
        name: String(name),
        department: String(department),
        issuse_type: String(fullType),
        reason: String(reason),
        added_by_user: String(addedByUser),
        status: "Pending",
        raisedate: new Date(),
      },
    })

    // Send email notification (best-effort)
    try {
      // Determine department email based on complaint type
      let deptEmail = "viresh.kumbhar@demandifymedia.com"
      switch (complaintType) {
        case "HRMs":
        case "HARITECH HRMS Portal Issue":
          deptEmail = "shraddha.adhav@demandifymedia.com"
          break
        case "HariDialer":
          deptEmail = "rutuja.pawar@demandifymedia.com"
          break
        case "Technical":
          deptEmail = "informationtechnology@demandifymedia.com"
          break
        case "HR-related":
          deptEmail = "hr@demandifymedia.com"
          break
        case "Other":
          deptEmail = "info@demandifymedia.com"
          break
        case "General":
        default:
          deptEmail = "viresh.kumbhar@demandifymedia.com"
          break
      }

      // Get user email for reply-to only
      const userRow = await prisma.$queryRaw<Array<{ email: string | null }>>`
        SELECT email FROM users WHERE Full_name = ${addedByUser} OR name = ${addedByUser} LIMIT 1
      `
      const userEmail = userRow?.[0]?.email ? String(userRow[0].email) : undefined

      // Send only to department email, not to the user
      const recipients = [deptEmail]

      const subject = `🎫 New Complaint Raised by ${name}`
      // Use actual server URL for emails (not localhost)
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || "http://localhost:3000"
      const link = `${baseUrl}/pages/hr/complaints`
      
      // Only include attachment if we have a valid public URL
      let attachmentInfo = ""
      if (attachmentPath) {
        if (baseUrl.includes("localhost")) {
          attachmentInfo = `<p><strong>📎 Attachment:</strong> File uploaded (accessible only on server)</p>`
        } else {
          attachmentInfo = `<p><strong>📎 Attachment:</strong> <a href="${baseUrl}${attachmentPath}" target="_blank">View Attachment</a></p>`
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
      `
      await sendMail({
        to: recipients,
        subject,
        html,
        replyTo: userEmail,
        text: `New complaint by ${name} (${userEmail || "N/A"}). Department: ${department}. Type: ${fullType}. Reason: ${String(reason)}. View: ${link}`,
      })
    } catch (emailError) {
      logger.error('Failed to send complaint creation email', { error: (emailError as any)?.message });
      // Continue even if email fails
    }

    return NextResponse.json({ id: created.id, message: "Complaint raised successfully", attachmentPath }, { status: 201 })
  } catch (e: any) {
    const message = typeof e?.message === "string" ? e.message : "Failed to create complaint"
    logger.error('Failed to create complaint', { error: message });
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const body = await req.json();
    const parsed = updateComplaintSchema.safeParse({
      ...body,
      id: body?.id !== undefined ? Number(body.id) : undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          issues: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { id, ...validatedBody } = parsed.data;

    const data: any = {}
    if (validatedBody.status) data.status = String(validatedBody.status)
    if (validatedBody.resolution_comment !== undefined) data.resolution_comment = String(validatedBody.resolution_comment)
    if (validatedBody.resolved_by) data.resolved_by = String(validatedBody.resolved_by)
    if (validatedBody.acknowledgement_status) data.acknowledgement_status = String(validatedBody.acknowledgement_status)
    if (validatedBody.acknowledgement_by) data.acknowledgement_by = String(validatedBody.acknowledgement_by)
    if (validatedBody.Attendance_status) data.Attendance_status = String(validatedBody.Attendance_status)
    if (validatedBody.Attendance_Approval) data.Attendance_Approval = String(validatedBody.Attendance_Approval)
    if (validatedBody.Attendance_feedback) data.Attendance_feedback = String(validatedBody.Attendance_feedback)

    if (validatedBody.status === "Resolved" && !data.resolved_date) {
      data.resolved_date = new Date()
    }
    if (validatedBody.acknowledgement_status && !data.acknowledgement_date) {
      data.acknowledgement_date = new Date()
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 })
    }

    const updatedComplaint = await prisma.issuedata.update({
      where: { id },
      data,
    })

    // Send email notification when ticket is acknowledged
    if (validatedBody.acknowledgement_status === "Acknowledged") {
      try {
        // Get user email
        const userRow = await prisma.$queryRaw<Array<{ email: string | null }>>`
          SELECT email FROM users WHERE Full_name = ${updatedComplaint.added_by_user} OR name = ${updatedComplaint.added_by_user} LIMIT 1
        `
        const userEmail = userRow?.[0]?.email ? String(userRow[0].email) : null

        if (userEmail) {
          const subject = `Your Ticket #${id} Has Been Acknowledged`
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || "http://localhost:3000"
          const link = `${baseUrl}/pages/user/RaiseComplaint/Raise-Tickets`
          
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
          `

          await sendMail({
            to: [userEmail],
            subject,
            html,
          })
        }
      } catch (emailError) {
        logger.error('Failed to send acknowledgment email', { error: (emailError as any)?.message });
        // Don't fail the request if email fails
      }
    }

    // Send email notification when ticket is resolved
    if (validatedBody.status === "Resolved" && data.resolution_comment) {
      try {
        // Get user email
        const userRow = await prisma.$queryRaw<Array<{ email: string | null }>>`
          SELECT email FROM users WHERE Full_name = ${updatedComplaint.added_by_user} OR name = ${updatedComplaint.added_by_user} LIMIT 1
        `
        const userEmail = userRow?.[0]?.email ? String(userRow[0].email) : null

        if (userEmail) {
          const subject = ` Your Ticket #${id} Has Been Resolved`
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || "http://localhost:3000"
          const link = `${baseUrl}/pages/user/RaiseComplaint/Raise-Tickets`
          
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
          `

          await sendMail({
            to: [userEmail],
            subject,
            html,
          })
        }
      } catch (emailError) {
        logger.error('Failed to send resolution email', { error: (emailError as any)?.message });
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({ ok: true, message: "Complaint updated successfully" })
  } catch (e: any) {
    const message = typeof e?.message === "string" ? e.message : "Failed to update complaint"
    logger.error('Failed to update complaint', { error: message });
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
