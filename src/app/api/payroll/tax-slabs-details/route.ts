import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import {prisma} from '@/lib/prisma';

export async function GET(request: NextRequest) {
  // Authentication
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
    console.error('Tax slabs API: No token found - missing access_token cookie or authorization header');
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }

  try {
    verifyToken(token);
  } catch (error) {
    console.error('Tax slabs API: Token verification failed:', error);
    return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
  }

  try {
    // Return income tax slabs data
    // TODO: Once income_tax_slabs table is populated, uncomment the database query below
    // const taxSlabs = await prisma.income_tax_slabs.findMany({
    //   orderBy: [
    //     { category: 'asc' },
    //     { serial: 'asc' }
    //   ]
    // });

    // Return standard income tax slabs data
    if (true) {
      const mockData = [
        {
          category: 'individual',
          slabs: [
            { serial: 1, tax_regime: 'OLD', lower_limit: 0, upper_limit: 250000, tax_percentage: 0 },
            { serial: 2, tax_regime: 'OLD', lower_limit: 250001, upper_limit: 500000, tax_percentage: 5 },
            { serial: 3, tax_regime: 'OLD', lower_limit: 500001, upper_limit: 1000000, tax_percentage: 20 },
            { serial: 4, tax_regime: 'OLD', lower_limit: 1000001, upper_limit: 99999999999, tax_percentage: 30 },
            { serial: 16, tax_regime: 'NEW', lower_limit: 0, upper_limit: 400000, tax_percentage: 0 },
            { serial: 17, tax_regime: 'NEW', lower_limit: 400001, upper_limit: 800000, tax_percentage: 5 },
            { serial: 18, tax_regime: 'NEW', lower_limit: 800001, upper_limit: 1200000, tax_percentage: 10 },
            { serial: 19, tax_regime: 'NEW', lower_limit: 1200001, upper_limit: 1600000, tax_percentage: 15 },
            { serial: 20, tax_regime: 'NEW', lower_limit: 1600001, upper_limit: 2000000, tax_percentage: 20 },
            { serial: 21, tax_regime: 'NEW', lower_limit: 2000001, upper_limit: 2400000, tax_percentage: 25 },
            { serial: 22, tax_regime: 'NEW', lower_limit: 2400001, upper_limit: 999999999, tax_percentage: 30 },
          ]
        },
        {
          category: 'senior-citizen',
          slabs: [
            { serial: 5, tax_regime: 'OLD', lower_limit: 0, upper_limit: 300000, tax_percentage: 0 },
            { serial: 6, tax_regime: 'OLD', lower_limit: 300001, upper_limit: 500000, tax_percentage: 5 },
            { serial: 7, tax_regime: 'OLD', lower_limit: 500001, upper_limit: 1000000, tax_percentage: 20 },
            { serial: 8, tax_regime: 'OLD', lower_limit: 1000001, upper_limit: 99999999999, tax_percentage: 30 },
            { serial: 30, tax_regime: 'NEW', lower_limit: 0, upper_limit: 400000, tax_percentage: 0 },
            { serial: 31, tax_regime: 'NEW', lower_limit: 400001, upper_limit: 800000, tax_percentage: 5 },
            { serial: 32, tax_regime: 'NEW', lower_limit: 800001, upper_limit: 1200000, tax_percentage: 10 },
            { serial: 33, tax_regime: 'NEW', lower_limit: 1200001, upper_limit: 1600000, tax_percentage: 15 },
            { serial: 34, tax_regime: 'NEW', lower_limit: 1600001, upper_limit: 2000000, tax_percentage: 20 },
            { serial: 35, tax_regime: 'NEW', lower_limit: 2000001, upper_limit: 2400000, tax_percentage: 25 },
            { serial: 36, tax_regime: 'NEW', lower_limit: 2400001, upper_limit: 999999999, tax_percentage: 30 },
          ]
        },
        {
          category: 'super-senior-citizen',
          slabs: [
            { serial: 9, tax_regime: 'OLD', lower_limit: 0, upper_limit: 500000, tax_percentage: 0 },
            { serial: 10, tax_regime: 'OLD', lower_limit: 500001, upper_limit: 1000000, tax_percentage: 20 },
            { serial: 11, tax_regime: 'OLD', lower_limit: 1000001, upper_limit: 99999999999, tax_percentage: 30 },
            { serial: 37, tax_regime: 'NEW', lower_limit: 0, upper_limit: 400000, tax_percentage: 0 },
            { serial: 38, tax_regime: 'NEW', lower_limit: 400001, upper_limit: 800000, tax_percentage: 5 },
            { serial: 39, tax_regime: 'NEW', lower_limit: 800001, upper_limit: 1200000, tax_percentage: 10 },
            { serial: 40, tax_regime: 'NEW', lower_limit: 1200001, upper_limit: 1600000, tax_percentage: 15 },
            { serial: 41, tax_regime: 'NEW', lower_limit: 1600001, upper_limit: 2000000, tax_percentage: 20 },
            { serial: 42, tax_regime: 'NEW', lower_limit: 2000001, upper_limit: 2400000, tax_percentage: 25 },
            { serial: 43, tax_regime: 'NEW', lower_limit: 2400001, upper_limit: 999999999, tax_percentage: 30 },
          ]
        }
      ];

      return NextResponse.json(
        { success: true, data: mockData },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Pragma': 'no-cache',
          }
        }
      );
    }
  } catch (error: any) {
    console.error('Error fetching tax slabs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tax slabs', details: error.message },
      { status: 500 }
    );
  }
}
