import { NextRequest, NextResponse } from 'next/server';

function buildTargetUrl(req: NextRequest, base: string, emp?: string | null) {
  const hasProto = /^https?:\/\//i.test(base);
  const origin = req.nextUrl.origin;
  let u = hasProto ? base : `${origin}${base.startsWith('/') ? '' : '/'}${base}`;
  if (emp) u += `${u.includes('?') ? '&' : '?'}emp_code=${encodeURIComponent(emp)}`;
  return u;
}

export async function POST(req: NextRequest) {
  try {
    const url = process.env.ESSL_SYNC_URL;
    if (!url) return NextResponse.json({ ok: false, message: 'ESSL_SYNC_URL not configured' }, { status: 200 });

    const { searchParams } = new URL(req.url);
    const emp = searchParams.get('emp_code');
    const target = buildTargetUrl(req, url, emp);

    const controller = new AbortController();
    const timeout = Number(process.env.ESSL_SYNC_TIMEOUT_MS || 15000);
    const to = setTimeout(() => controller.abort(), timeout);

    let res: Response | null = null;
    let error: any = null;
    try {
      res = await fetch(target, { method: 'POST', signal: controller.signal });
    } catch (e: any) {
      error = e;
    } finally {
      clearTimeout(to);
    }

    if (!res) {
      const timedOut = error?.name === 'AbortError';
      return NextResponse.json(
        { ok: false, message: timedOut ? 'Timed out' : 'Network error', target },
        { status: 200 }
      );
    }

    // Try to parse a JSON success response, but ignore details
    return NextResponse.json({ ok: true, target }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e?.message || 'Failed' }, { status: 200 });
  }
}
