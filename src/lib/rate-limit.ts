
interface RateLimitStore {
    [key: string]: {
        count: number;
        resetTime: number;
    };
}

const store: RateLimitStore = {};

// Clean up expired entries every minute
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = Date.now();
        for (const key in store) {
            if (store[key].resetTime < now) {
                delete store[key];
            }
        }
    }, 60000);
}

export function checkRateLimit(ip: string, limit: number = 100, windowMs: number = 60000): { success: boolean; remaining: number; reset: number } {
    const now = Date.now();
    const key = ip;

    if (!store[key]) {
        store[key] = {
            count: 1,
            resetTime: now + windowMs
        };
        return { success: true, remaining: limit - 1, reset: store[key].resetTime };
    }

    if (store[key].resetTime < now) {
        store[key] = {
            count: 1,
            resetTime: now + windowMs
        };
        return { success: true, remaining: limit - 1, reset: store[key].resetTime };
    }

    store[key].count++;
    const remaining = Math.max(0, limit - store[key].count);

    return {
        success: store[key].count <= limit,
        remaining,
        reset: store[key].resetTime
    };
}
