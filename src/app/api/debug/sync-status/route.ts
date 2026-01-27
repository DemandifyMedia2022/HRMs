import { NextRequest, NextResponse } from 'next/server';
import { getSyncCacheStatus, clearSyncCache } from '@/lib/essl-sync';

export async function GET(req: NextRequest) {
  try {
    const cacheStatus = getSyncCacheStatus();
    
    return NextResponse.json({
      syncCache: cacheStatus,
      totalEntries: Object.keys(cacheStatus).length,
      timestamp: new Date().toISOString()
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    clearSyncCache();
    
    return NextResponse.json({
      message: 'Sync cache cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'error' }, { status: 500 });
  }
}