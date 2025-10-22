import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Call the sync endpoint
    const baseUrl = request.nextUrl.origin;
    const response = await fetch(`${baseUrl}/api/essl/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fromDate: '2025-01-01 07:00:00'
        // toDate will default to now
      })
    });

    const data = await response.json();

    return NextResponse.json({
      message: 'ESSL Sync Test',
      result: data
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Test failed', details: error.message }, { status: 500 });
  }
}
