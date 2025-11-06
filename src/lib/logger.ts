type LogLevel = 'debug' | 'info' | 'error';

function shouldLog(level: LogLevel): boolean {
  const envLevel = (process.env.LOG_LEVEL || (process.env.NODE_ENV === 'development' ? 'debug' : 'info')).toLowerCase();
  const order: Record<LogLevel, number> = { debug: 10, info: 20, error: 30 };
  const current = (['debug', 'info', 'error'] as LogLevel[]).includes(envLevel as LogLevel)
    ? (envLevel as LogLevel)
    : 'info';
  return order[level] >= order[current as LogLevel];
}

export function createLogger(moduleName: string) {
  const prefix = moduleName ? `[${moduleName}]` : '';
  return {
    debug(message: string, meta?: Record<string, unknown>) {
      if (process.env.NODE_ENV === 'production') return; // disable debug in prod
      if (!shouldLog('debug')) return;
      // eslint-disable-next-line no-console
      console.debug(prefix, message, meta ? { ...meta } : undefined);
    },
    info(message: string, meta?: Record<string, unknown>) {
      if (!shouldLog('info')) return;
      // eslint-disable-next-line no-console
      console.info(prefix, message, meta ? { ...meta } : undefined);
    },
    error(message: string, meta?: Record<string, unknown>) {
      if (!shouldLog('error')) return;
      // eslint-disable-next-line no-console
      console.error(prefix, message, meta ? { ...meta } : undefined);
    }
  };
}
