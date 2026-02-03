import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

function getAuth(req: NextRequest) {
  try {
    const token = req.cookies.get('access_token')?.value;
    console.log('Token found:', !!token);
    if (!token) {
      console.log('No access_token cookie found');
      return null;
    }
    const payload = verifyToken(token) as any;
    console.log('Token verified successfully, payload:', { id: payload.id, email: payload.email, role: payload.role });
    return payload; // Returns the whole payload including id, email, role, etc.
  } catch (error: any) {
    console.error('Token verification failed:', error.message);
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    console.log('GET /api/forms - Request received');
    
    const auth = getAuth(req);
    console.log('Auth result:', auth ? 'Authenticated' : 'Not authenticated');
    
    if (!auth) {
      console.log('Returning 401 - Unauthorized');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userName = searchParams.get('user_name');
    const todayOnly = searchParams.get('today') === '1';

    // Build where clause based on user role
    let whereClause: any = {};
    
    // If user is not admin, only show their own data
    if (auth.role !== 'admin') {
      whereClause.added_by_user_id = String(auth.id);
      console.log('Non-admin user, filtering by user_id:', String(auth.id));
    }

    if (todayOnly) {
      const istDate = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
      const start = new Date(`${istDate}T00:00:00+05:30`);
      const end = new Date(`${istDate}T23:59:59.999+05:30`);
      whereClause.f_date = { gte: start, lte: end };
    }

    console.log('Querying dm_form table with where clause:', whereClause);
    
    const formData = await prisma.dm_form.findMany({
      where: whereClause,
      orderBy: {
        f_date: 'desc'
      },
      take: 1000 // Limit to last 1000 records for performance
    });

    console.log('Query successful, found', formData.length, 'records');

    return NextResponse.json({
      success: true,
      data: formData
    });

  } catch (error: any) {
    console.error('Error fetching form data:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
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

    const asTrimmedString = (v: unknown) => {
      if (v === null || v === undefined) return '';
      if (typeof v === 'string') return v.trim();
      if (typeof v === 'number' || typeof v === 'boolean') return String(v);
      return '';
    };

    const getStr = (k: string) => asTrimmedString((body as any)?.[k]);

    const meaningfulKeys = [
      'f_campaign_name',
      'f_lead',
      'f_resource_name',
      'f_data_source',
      'f_salutation',
      'f_first_name',
      'f_last_name',
      'f_job_title',
      'f_department',
      'f_job_level',
      'f_email_add',
      'Secondary_Email',
      'f_conatct_no',
      'f_company_name',
      'f_website',
      'f_address1',
      'f_city',
      'f_state',
      'f_zip_code',
      'f_country',
      'f_emp_size',
      'f_industry',
      'f_sub_industry',
      'f_revenue',
      'f_revenue_link',
      'f_profile_link',
      'f_company_link',
      'f_address_link',
      'f_cq1',
      'f_cq2',
      'f_cq3',
      'f_cq4',
      'f_cq5',
      'f_cq6',
      'f_cq7',
      'f_cq8',
      'f_cq9',
      'f_cq10',
      'f_asset_name1',
      'f_asset_name2',
      'f_call_recording',
      'f_dq_reason1',
      'f_dq_reason2',
      'f_dq_reason3',
      'f_dq_reason4',
      'f_call_links'
    ];

    const hasMeaningfulData = meaningfulKeys.some((k) => {
      const v = (body as any)?.[k];
      if (v === null || v === undefined) return false;
      if (typeof v === 'string') return v.trim().length > 0;
      return true;
    });

    if (!hasMeaningfulData) {
      return NextResponse.json({ message: 'Empty form submission is not allowed' }, { status: 400 });
    }

    // Strict mode: reject unless the required set of fields is filled.
    // (You can loosen/tighten this list based on your exact business rules.)
    const REQUIRED_KEYS = [
      'f_campaign_name',
      'f_lead',
      'f_resource_name',
      'f_data_source',
      'f_salutation',
      'f_first_name',
      'f_last_name',
      'f_job_title',
      'f_department',
      'f_job_level',
      'f_email_add',
      'f_conatct_no',
      'f_company_name',
      'f_website',
      'f_address1',
      'f_city',
      'f_state',
      'f_zip_code',
      'f_country',
      'f_emp_size',
      'f_industry',
      'f_sub_industry',
      'f_revenue',
      'f_revenue_link',
      'f_profile_link',
      'f_company_link',
      'f_address_link'
    ];
    const missing = REQUIRED_KEYS.filter(k => !getStr(k));
    if (missing.length) {
      return NextResponse.json(
        {
          message: 'Please fill all required fields before submitting',
          missing
        },
        { status: 400 }
      );
    }

    const contactNo = getStr('f_conatct_no');
    const email = getStr('f_email_add');
    const firstName = getStr('f_first_name');
    const companyName = getStr('f_company_name');

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
      f_campaign_name: asTrimmedString((body as any)?.f_campaign_name),
      f_lead: asTrimmedString((body as any)?.f_lead),
      f_resource_name: asTrimmedString((body as any)?.f_resource_name),
      f_data_source: asTrimmedString((body as any)?.f_data_source),
      f_salutation: asTrimmedString((body as any)?.f_salutation),
      f_first_name: firstName,
      f_last_name: asTrimmedString((body as any)?.f_last_name),
      f_job_title: asTrimmedString((body as any)?.f_job_title),
      f_department: asTrimmedString((body as any)?.f_department),
      f_job_level: asTrimmedString((body as any)?.f_job_level),
      f_email_add: email,
      Secondary_Email: asTrimmedString((body as any)?.Secondary_Email),
      f_conatct_no: contactNo,
      f_company_name: companyName,
      f_website: asTrimmedString((body as any)?.f_website),
      f_address1: asTrimmedString((body as any)?.f_address1),
      f_city: asTrimmedString((body as any)?.f_city),
      f_state: asTrimmedString((body as any)?.f_state),
      f_zip_code: asTrimmedString((body as any)?.f_zip_code),
      f_country: asTrimmedString((body as any)?.f_country),
      f_emp_size: asTrimmedString((body as any)?.f_emp_size),
      f_industry: asTrimmedString((body as any)?.f_industry),
      f_sub_industry: asTrimmedString((body as any)?.f_sub_industry),
      f_revenue: asTrimmedString((body as any)?.f_revenue),
      f_revenue_link: asTrimmedString((body as any)?.f_revenue_link),
      f_profile_link: asTrimmedString((body as any)?.f_profile_link),
      f_company_link: asTrimmedString((body as any)?.f_company_link),
      f_address_link: asTrimmedString((body as any)?.f_address_link),
      f_cq1: asTrimmedString((body as any)?.f_cq1),
      f_cq2: asTrimmedString((body as any)?.f_cq2),
      f_cq3: asTrimmedString((body as any)?.f_cq3),
      f_cq4: asTrimmedString((body as any)?.f_cq4),
      f_cq5: asTrimmedString((body as any)?.f_cq5),
      f_cq6: asTrimmedString((body as any)?.f_cq6),
      f_cq7: asTrimmedString((body as any)?.f_cq7),
      f_cq8: asTrimmedString((body as any)?.f_cq8),
      f_cq9: asTrimmedString((body as any)?.f_cq9),
      f_cq10: asTrimmedString((body as any)?.f_cq10),
      f_asset_name1: asTrimmedString((body as any)?.f_asset_name1),
      f_asset_name2: asTrimmedString((body as any)?.f_asset_name2),
      f_call_recording: asTrimmedString((body as any)?.f_call_recording),
      f_dq_reason1: asTrimmedString((body as any)?.f_dq_reason1),
      f_dq_reason2: asTrimmedString((body as any)?.f_dq_reason2),
      f_dq_reason3: asTrimmedString((body as any)?.f_dq_reason3),
      f_dq_reason4: asTrimmedString((body as any)?.f_dq_reason4),
      f_call_links: asTrimmedString((body as any)?.f_call_links),

      // Use the authenticated user's name or ID for added_by_user_id
      added_by_user_id: String(auth.id),

      f_date: fDate,
      form_status: formStatus,
    };

    // Prevent accidental duplicate inserts (double click / retry) within a short window.
    const dedupeWindowMs = 30_000;
    const after = new Date(Date.now() - dedupeWindowMs);
    const existing = await prisma.dm_form.findFirst({
      where: {
        added_by_user_id: String(auth.id),
        f_conatct_no: dataToSave.f_conatct_no,
        f_email_add: dataToSave.f_email_add,
        f_first_name: dataToSave.f_first_name,
        f_company_name: dataToSave.f_company_name,
        f_campaign_name: dataToSave.f_campaign_name,
        f_lead: dataToSave.f_lead,
        f_resource_name: dataToSave.f_resource_name,
        f_date: { gte: after, lte: new Date() }
      },
      orderBy: { f_date: 'desc' }
    });
    if (existing) {
      return NextResponse.json({
        success: true,
        insertedId: Number((existing as any).f_id),
        message: 'Duplicate submission ignored'
      });
    }

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
