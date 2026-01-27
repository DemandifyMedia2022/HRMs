/**
 * Centralized ESSL sync utility to prevent race conditions
 * and ensure consistent attendance data across all APIs
 */

// Global cache for ESSL sync to prevent race conditions
declare global {
  var esslSyncCache: Map<string, number> | undefined;
}

interface SyncOptions {
  date?: string;
  employeeCode?: string;
  forceSync?: boolean;
  timeout?: number;
}

/**
 * Triggers ESSL sync with rate limiting to prevent race conditions
 * @param options Sync configuration options
 * @returns Promise that resolves when sync is initiated (not completed)
 */
export async function triggerEsslSync(options: SyncOptions = {}): Promise<boolean> {
  const syncUrl = process.env.ESSL_SYNC_URL;
  if (!syncUrl) {
    return false;
  }

  try {
    // Initialize global cache if not exists
    if (!global.esslSyncCache) {
      global.esslSyncCache = new Map();
    }

    // Determine target date
    const getISTDate = () => {
      return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    };
    const targetDate = options.date || getISTDate();
    
    // Create cache key
    const cacheKey = options.employeeCode 
      ? `essl_sync_${targetDate}_${options.employeeCode}`
      : `essl_sync_${targetDate}`;
    
    const now = Date.now();
    const lastSync = global.esslSyncCache.get(cacheKey);
    
    // Rate limiting: only sync once per minute unless forced
    const SYNC_INTERVAL = 60000; // 1 minute
    const shouldTriggerSync = options.forceSync || !lastSync || (now - lastSync) > SYNC_INTERVAL;
    
    if (!shouldTriggerSync) {
      return false; // Skip sync, too recent
    }

    // Update cache
    global.esslSyncCache.set(cacheKey, now);
    
    // Prepare sync request
    const controller = new AbortController();
    const timeout = options.timeout || Number(process.env.ESSL_SYNC_TIMEOUT_MS || 3000);
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const syncBody = {
      fromDate: `${targetDate} 00:00:00`,
      toDate: 'now',
      lookbackDays: 0
    };

    // Add employee filter if specified
    let finalSyncUrl = syncUrl;
    if (options.employeeCode) {
      finalSyncUrl += `${syncUrl.includes('?') ? '&' : '?'}emp_code=${encodeURIComponent(options.employeeCode)}`;
    }

    // Fire-and-forget sync request
    fetch(finalSyncUrl, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(syncBody)
    })
    .then(() => clearTimeout(timeoutId))
    .catch(() => clearTimeout(timeoutId));

    return true; // Sync initiated
  } catch (error) {
    console.warn('ESSL sync failed:', error);
    return false;
  }
}

/**
 * Waits for sync to potentially complete with a reasonable delay
 * @param syncInitiated Whether sync was actually initiated
 * @param isFirstSync Whether this is the first sync of the session
 */
export async function waitForSync(syncInitiated: boolean, isFirstSync: boolean = false): Promise<void> {
  if (!syncInitiated) {
    return; // No sync was triggered, no need to wait
  }

  // Longer delay for first sync, shorter for subsequent ones
  const delay = isFirstSync ? 1000 : 300;
  await new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Clears the sync cache (useful for testing or manual refresh)
 */
export function clearSyncCache(): void {
  if (global.esslSyncCache) {
    global.esslSyncCache.clear();
  }
}

/**
 * Gets sync cache status for debugging
 */
export function getSyncCacheStatus(): { [key: string]: number } {
  if (!global.esslSyncCache) {
    return {};
  }
  
  const status: { [key: string]: number } = {};
  for (const [key, timestamp] of global.esslSyncCache.entries()) {
    status[key] = Date.now() - timestamp; // Time since last sync
  }
  
  return status;
}