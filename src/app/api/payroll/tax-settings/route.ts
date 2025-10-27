import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const cookies = request.cookies;
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');

    let token: string | null = null;
    if (cookies.has('access_token')) {
      token = cookies.get('access_token')?.value || null;
    }
    if (!token && authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }

    if (!token) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    try {
      verifyToken(token);
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
    }

    // Fetch tax settings from database (matches Laravel: DB::table('tax_setting')->get())
    const taxSettings = await prisma.tax_setting.findMany();

    // Return first record or defaults if none exist
    const taxSetting = taxSettings.length > 0 ? taxSettings[0] : null;

    if (!taxSetting) {
      // Return default structure if no data exists
      return NextResponse.json({
        success: true,
        data: {
          children_no: 0,
          tution_fees: '0',
          hostel_fees: '0',
          net_taxable_old: '0',
          net_taxable_new: '0',
          tax_rebate_old: '0',
          tax_rebate_new: '0',
          standard_deduction_old: '0',
          standard_deduction_new: '0',
          propose_investment: '0',
          confirm_investment: '0',
          month: '',
          rent_paid: '0',
          house_property: '0',
          housing_loan: '0',
          cess_charge: '0',
          Senior_citizen_age: 0,
          super_citizen_age: 0,
          lta_block_start: new Date().getFullYear(),
          lta_block_end: new Date().getFullYear(),
          annuation_exemption: '0',
          hra_calc: 'Prorate with DOJ, projected DOL',
          tdspan: 'No',
          tdsadhar: 'No',
          adhar: 'No',
          tds: 'No',
          income: 'No',
          challantax: 'No',
          taxable: '10 rupees',
          component: 'Proportionate'
        }
      });
    }

    return NextResponse.json(
      {
        success: true,
        data: taxSetting
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          Pragma: 'no-cache'
        }
      }
    );
  } catch (error: any) {
    console.error('Error fetching tax settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tax settings', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookies = request.cookies;
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');

    let token: string | null = null;
    if (cookies.has('access_token')) {
      token = cookies.get('access_token')?.value || null;
    }
    if (!token && authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }

    if (!token) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    try {
      verifyToken(token);
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
    }

    const body = await request.json();

    // Match condition (using user_id if provided, otherwise update first record)
    const matchCondition = body.user_id ? { user_id: body.user_id } : {};

    // Prepare data for update/insert
    const taxSettingData = {
      user_id: body.user_id || null,
      children_no: body.children_no ? parseInt(body.children_no) : null,
      tution_fees: body.tution_fees || null,
      hostel_fees: body.hostel_fees || null,
      net_taxable_old: body.net_taxable_old || null,
      net_taxable_new: body.net_taxable_new || null,
      tax_rebate_old: body.tax_rebate_old || null,
      tax_rebate_new: body.tax_rebate_new || null,
      standard_deduction_old: body.standard_deduction_old || null,
      standard_deduction_new: body.standard_deduction_new || null,
      propose_investment: body.propose_investment || null,
      confirm_investment: body.confirm_investment || null,
      month: body.month || null,
      rent_paid: body.rent_paid || null,
      house_property: body.house_property || null,
      housing_loan: body.housing_loan || null,
      cess_charge: body.cess_charge || null,
      Senior_citizen_age: body.Senior_citizen_age ? parseInt(body.Senior_citizen_age) : null,
      super_citizen_age: body.super_citizen_age ? parseInt(body.super_citizen_age) : null,
      lta_block_start: body.lta_block_start ? parseInt(body.lta_block_start) : null,
      lta_block_end: body.lta_block_end ? parseInt(body.lta_block_end) : null,
      annuation_exemption: body.annuation_exemption || null,
      hra_calc: body.hra_calc || null,
      tdspan: body.tdspan || null,
      tdsadhar: body.tdsadhar || null,
      adhar: body.adhar || null,
      tds: body.tds || null,
      income: body.income || null,
      challantax: body.challantax || null,
      taxable: body.taxable || null,
      component: body.component || null
    };

    // Laravel: DB::table('tax_setting')->updateOrInsert($match, $data)
    // Check if record exists
    const existingSetting = await prisma.tax_setting.findFirst({
      where: matchCondition
    });

    let result;
    if (existingSetting) {
      // Update existing record
      result = await prisma.tax_setting.update({
        where: { id: existingSetting.id },
        data: taxSettingData
      });
    } else {
      // Create new record
      result = await prisma.tax_setting.create({
        data: taxSettingData
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Tax settings saved successfully',
      data: result
    });
  } catch (error: any) {
    console.error('Error saving tax settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save tax settings', details: error.message },
      { status: 500 }
    );
  }
}
