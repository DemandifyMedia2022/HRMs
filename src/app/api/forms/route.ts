import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

function getAuth(req: NextRequest) {
  try {
    const token = req.cookies.get('access_token')?.value;
    if (!token) return null;
    const payload = verifyToken(token) as any;
    return payload; // Returns the whole payload including id, email, role, etc.
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = getAuth(req);
    // Allow any authenticated user to save data, as requested
    if (!auth) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Prepare data for Prisma
    // We map keys from the body to the prisma schema
    // Most keys match directly (f_campaign_name, etc)
    // Handle specific fields:

    // Convert f_date string to Date object
    let fDate = new Date();
    if (body.f_date) {
      const parsed = new Date(body.f_date);
      if (!isNaN(parsed.getTime())) {
        fDate = parsed;
      }
    }

    // Default form_status if not provided
    const formStatus = body.form_status ? Number(body.form_status) : 1;

    const dataToSave = {
      f_campaign_name: body.f_campaign_name || null,
      f_lead: body.f_lead || null,
      f_resource_name: body.f_resource_name || null,
      f_data_source: body.f_data_source || null,
      f_salutation: body.f_salutation || null,
      f_first_name: body.f_first_name || null,
      f_last_name: body.f_last_name || null,
      f_job_title: body.f_job_title || null,
      f_department: body.f_department || null,
      f_job_level: body.f_job_level || null,
      f_email_add: body.f_email_add || null,
      Secondary_Email: body.Secondary_Email || null,
      f_conatct_no: body.f_conatct_no || null,
      f_company_name: body.f_company_name || null,
      f_website: body.f_website || null,
      f_address1: body.f_address1 || null,
      f_city: body.f_city || null,
      f_state: body.f_state || null,
      f_zip_code: body.f_zip_code || null,
      f_country: body.f_country || null,
      f_emp_size: body.f_emp_size || null,
      f_industry: body.f_industry || null,
      f_sub_industry: body.f_sub_industry || null,
      f_revenue: body.f_revenue || null,
      f_revenue_link: body.f_revenue_link || null,
      f_profile_link: body.f_profile_link || null,
      f_company_link: body.f_company_link || null,
      f_address_link: body.f_address_link || null,
      f_cq1: body.f_cq1 || null,
      f_cq2: body.f_cq2 || null,
      f_cq3: body.f_cq3 || null,
      f_cq4: body.f_cq4 || null,
      f_cq5: body.f_cq5 || null,
      f_cq6: body.f_cq6 || null,
      f_cq7: body.f_cq7 || null,
      f_cq8: body.f_cq8 || null,
      f_cq9: body.f_cq9 || null,
      f_cq10: body.f_cq10 || null,
      f_asset_name1: body.f_asset_name1 || null,
      f_asset_name2: body.f_asset_name2 || null,
      f_call_recording: body.f_call_recording || null,
      f_dq_reason1: body.f_dq_reason1 || null,
      f_dq_reason2: body.f_dq_reason2 || null,
      f_dq_reason3: body.f_dq_reason3 || null,
      f_dq_reason4: body.f_dq_reason4 || null,
      f_call_links: body.f_call_links || null,

      // Use the authenticated user's name or ID for added_by_user_id
      added_by_user_id: String(auth.id),

      f_date: fDate,
      form_status: formStatus,
    };

    const result = await prisma.dm_form.create({
      data: dataToSave
    });

    return NextResponse.json({
      success: true,
      insertedId: Number(result.f_id), // BigInt to Number
      message: 'Data saved successfully'
    });

  } catch (error: any) {
    console.error('Error saving form data:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
