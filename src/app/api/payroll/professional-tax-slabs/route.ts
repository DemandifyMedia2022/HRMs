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

    // Fetch professional tax slabs from database (matches Laravel: DB::table('slabs')->get())
    console.log('Fetching data from slabs table...');
    const slabs = await prisma.slabs.findMany();
    console.log('Fetched slab records:', slabs.length);

    // Use first record if multiple exist, or return defaults if none
    const slab = slabs.length > 0 ? slabs[0] : null;

    if (!slab) {
      // Return default structure if no data exists
      return NextResponse.json({
        success: true,
        data: {
          state: 'Maharashtra',
          branch: 'Pune',
          min_limit1: '0',
          max_limit1: '0',
          gender1: 'All',
          apr1: '0',
          may1: '0',
          jun1: '0',
          jul1: '0',
          aug1: '0',
          sep1: '0',
          oct1: '0',
          nov1: '0',
          dec1: '0',
          jan1: '0',
          feb1: '0',
          mar1: '0',
          min_limit2: '0',
          max_limit2: '0',
          gender2: 'All',
          apr2: '0',
          may2: '0',
          jun2: '0',
          jul2: '0',
          aug2: '0',
          sep2: '0',
          oct2: '0',
          nov2: '0',
          dec2: '0',
          jan2: '0',
          feb2: '0',
          mar2: '0',
          min_limit3: '0',
          max_limit3: '0',
          gender3: 'All',
          apr3: '0',
          may3: '0',
          jun3: '0',
          jul3: '0',
          aug3: '0',
          sep3: '0',
          oct3: '0',
          nov3: '0',
          dec3: '0',
          jan3: '0',
          feb3: '0',
          mar3: '0',
          min_limit4: '0',
          max_limit4: '0',
          gender4: 'All',
          apr4: '0',
          may4: '0',
          jun4: '0',
          jul4: '0',
          aug4: '0',
          sep4: '0',
          oct4: '0',
          nov4: '0',
          dec4: '0',
          jan4: '0',
          feb4: '0',
          mar4: '0',
          min_limit5: '0',
          max_limit5: '0',
          gender5: 'All',
          apr5: '0',
          may5: '0',
          jun5: '0',
          jul5: '0',
          aug5: '0',
          sep5: '0',
          oct5: '0',
          nov5: '0',
          dec5: '0',
          jan5: '0',
          feb5: '0',
          mar5: '0'
        }
      });
    }

    // Convert BigInt and integer fields to strings for frontend (BigInt cannot be serialized to JSON)
    const slabData = {
      ...slab,
      id: String(slab.id), // Convert BigInt to string
      min_limit1: String(slab.min_limit1 ?? 0),
      max_limit1: String(slab.max_limit1 ?? 0),
      min_limit2: String(slab.min_limit2 ?? 0),
      max_limit2: String(slab.max_limit2 ?? 0),
      min_limit3: String(slab.min_limit3 ?? 0),
      max_limit3: String(slab.max_limit3 ?? 0),
      min_limit4: String(slab.min_limit4 ?? 0),
      max_limit4: String(slab.max_limit4 ?? 0),
      min_limit5: String(slab.min_limit5 ?? 0),
      max_limit5: String(slab.max_limit5 ?? 0)
    };

    return NextResponse.json(
      {
        success: true,
        data: slabData
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0'
        }
      }
    );
  } catch (error: any) {
    console.error('Error fetching professional tax slabs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch professional tax slabs', details: error.message },
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

    // Match condition: state only (since branch can be null in DB)
    // This ensures we update the same record even if branch was null
    const matchCondition = {
      state: body.state || 'Maharashtra'
    };

    // Convert string values to appropriate types for database
    // Ensure branch is never null
    const slabData = {
      state: body.state && body.state !== 'null' ? body.state : 'Maharashtra',
      branch: body.branch && body.branch !== 'null' ? body.branch : 'Pune',
      min_limit1: parseInt(body.min_limit1) || 0,
      max_limit1: parseInt(body.max_limit1) || 0,
      gender1: body.gender1 || 'All',
      jan1: body.jan1 || '0',
      feb1: body.feb1 || '0',
      mar1: body.mar1 || '0',
      apr1: body.apr1 || '0',
      may1: body.may1 || '0',
      jun1: body.jun1 || '0',
      jul1: body.jul1 || '0',
      aug1: body.aug1 || '0',
      sep1: body.sep1 || '0',
      oct1: body.oct1 || '0',
      nov1: body.nov1 || '0',
      dec1: body.dec1 || '0',
      min_limit2: parseInt(body.min_limit2) || 0,
      max_limit2: parseInt(body.max_limit2) || 0,
      gender2: body.gender2 || 'All',
      jan2: body.jan2 || '0',
      feb2: body.feb2 || '0',
      mar2: body.mar2 || '0',
      apr2: body.apr2 || '0',
      may2: body.may2 || '0',
      jun2: body.jun2 || '0',
      jul2: body.jul2 || '0',
      aug2: body.aug2 || '0',
      sep2: body.sep2 || '0',
      oct2: body.oct2 || '0',
      nov2: body.nov2 || '0',
      dec2: body.dec2 || '0',
      min_limit3: parseInt(body.min_limit3) || 0,
      max_limit3: parseInt(body.max_limit3) || 0,
      gender3: body.gender3 || 'All',
      jan3: body.jan3 || '0',
      feb3: body.feb3 || '0',
      mar3: body.mar3 || '0',
      apr3: body.apr3 || '0',
      may3: body.may3 || '0',
      jun3: body.jun3 || '0',
      jul3: body.jul3 || '0',
      aug3: body.aug3 || '0',
      sep3: body.sep3 || '0',
      oct3: body.oct3 || '0',
      nov3: body.nov3 || '0',
      dec3: body.dec3 || '0',
      min_limit4: parseInt(body.min_limit4) || 0,
      max_limit4: parseInt(body.max_limit4) || 0,
      gender4: body.gender4 || 'All',
      jan4: body.jan4 || '0',
      feb4: body.feb4 || '0',
      mar4: body.mar4 || '0',
      apr4: body.apr4 || '0',
      may4: body.may4 || '0',
      jun4: body.jun4 || '0',
      jul4: body.jul4 || '0',
      aug4: body.aug4 || '0',
      sep4: body.sep4 || '0',
      oct4: body.oct4 || '0',
      nov4: body.nov4 || '0',
      dec4: body.dec4 || '0',
      min_limit5: parseInt(body.min_limit5) || 0,
      max_limit5: parseInt(body.max_limit5) || 0,
      gender5: body.gender5 || 'All',
      jan5: body.jan5 || '0',
      feb5: body.feb5 || '0',
      mar5: body.mar5 || '0',
      apr5: body.apr5 || '0',
      may5: body.may5 || '0',
      jun5: body.jun5 || '0',
      jul5: body.jul5 || '0',
      aug5: body.aug5 || '0',
      sep5: body.sep5 || '0',
      oct5: body.oct5 || '0',
      nov5: body.nov5 || '0',
      dec5: body.dec5 || '0'
    };

    // Laravel: DB::table('slabs')->updateOrInsert($match, $data)
    // Prisma equivalent: upsert with where condition
    console.log('Performing updateOrInsert with match:', matchCondition);
    console.log('Data to save:', slabData);

    // Check if record exists with state and branch
    const existingSlab = await prisma.slabs.findFirst({
      where: matchCondition
    });

    let result;
    if (existingSlab) {
      // Update existing slab (matches updateOrInsert update behavior)
      console.log('Updating existing slab with id:', existingSlab.id);
      result = await prisma.slabs.update({
        where: { id: existingSlab.id },
        data: slabData
      });
    } else {
      // Create new slab (matches updateOrInsert insert behavior)
      console.log('Creating new slab for state:', matchCondition.state, 'branch:', slabData.branch);
      result = await prisma.slabs.create({
        data: slabData
      });
    }

    // Convert BigInt to string for JSON serialization
    const resultData = {
      ...result,
      id: String(result.id)
    };

    console.log('Saved successfully, returning result');

    return NextResponse.json({
      success: true,
      message: 'Professional tax slabs saved successfully',
      data: resultData
    });
  } catch (error: any) {
    console.error('Error saving professional tax slabs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save professional tax slabs', details: error.message },
      { status: 500 }
    );
  }
}
