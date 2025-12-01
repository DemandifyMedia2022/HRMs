import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    
    // Get date range
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    yesterday.setHours(0, 0, 0, 0);
    
    const fromDate = body.fromDate || formatLocalDateTime(yesterday);
    const toDate = body.toDate || formatLocalDateTime(now);

    // ESSL Configuration
    const serverUrl = process.env.ESSL_SERVER_URL;
    const serialNumber = process.env.ESSL_SERIAL_NUMBER;
    const username = process.env.ESSL_USERNAME;
    const password = process.env.ESSL_PASSWORD;

    if (!serverUrl || !serialNumber || !username || !password) {
      return NextResponse.json(
        { error: 'ESSL configuration missing in environment variables' },
        { status: 500 }
      );
    }

    // Build SOAP XML request
    const xmlPostString = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <GetTransactionsLog xmlns="http://tempuri.org/">
      <FromDateTime>${fromDate}</FromDateTime>
      <ToDateTime>${toDate}</ToDateTime>
      <SerialNumber>${serialNumber}</SerialNumber>
      <UserName>${username}</UserName>
      <UserPassword>${password}</UserPassword>
      <strDataList></strDataList>
    </GetTransactionsLog>
  </soap:Body>
</soap:Envelope>`;

    console.log('Sending SOAP request to:', serverUrl);
    console.log('Date range:', fromDate, 'to', toDate);

    // Make SOAP request
    const response = await axios.post(serverUrl, xmlPostString, {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': '"http://tempuri.org/GetTransactionsLog"',
      },
      timeout: 30000,
    });

    return NextResponse.json({
      success: true,
      serverUrl,
      dateRange: { from: fromDate, to: toDate },
      responseStatus: response.status,
      responseHeaders: response.headers,
      responseData: response.data,
      responsePreview: response.data.substring(0, 1000),
    });

  } catch (error: any) {
    console.error('ESSL Debug Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch ESSL data',
        details: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}

function formatLocalDateTime(d: Date): string {
  const yyyy = d.getFullYear();
  const MM = String(d.getMonth() + 1).padStart(2, '0');
  const DD = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${yyyy}-${MM}-${DD} ${hh}:${mm}:${ss}`;
}

export async function GET(request: NextRequest) {
  return POST(request);
}
